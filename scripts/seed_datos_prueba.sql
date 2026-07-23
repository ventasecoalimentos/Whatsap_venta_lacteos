-- Datos de prueba para ver el dashboard con volumen real (~50 clientes + pedidos + PQRSF).
-- Se puede correr las veces que haga falta en el SQL Editor de Supabase, DESPUÉS de tener
-- schema.sql aplicado — el delete de abajo limpia la corrida anterior antes de insertar de nuevo.
--
-- Los teléfonos usan el prefijo +573000000XXX a propósito — no son números reales, y ese
-- prefijo sirve para poder borrarlos (ver delete de abajo). Borrar de `clientes` arrastra en
-- cascada `pedidos`/`servicio_cliente`/`conversaciones` (on delete cascade en schema.sql), así
-- que un solo delete limpia todo.
delete from clientes where telefono like '+573000000%';

do $$
declare
  nombres text[] := array['María','José','Carlos','Ana','Luis','Diana','Andrés','Paula','Juan','Camila',
                           'Jorge','Laura','Miguel','Valentina','Fernando','Daniela','Ricardo','Sofía',
                           'Alejandro','Mariana','Sandra','Felipe','Natalia','Óscar','Carolina'];
  apellidos text[] := array['García','Rodríguez','Martínez','López','González','Pérez','Sánchez','Ramírez',
                             'Torres','Flores','Rivera','Gómez','Díaz','Reyes','Morales','Cruz','Ortiz',
                             'Gutiérrez','Chávez','Ramos'];
  ciudades text[] := array['Bogotá','Bogotá','Bogotá','Villavicencio','Villavicencio','Yopal','Otra'];
  descripciones_pqr text[] := array[
    'El pedido llegó incompleto',
    'La leche llegó vencida',
    'El domiciliario se demoró mucho más de lo prometido',
    'Faltó un producto en la entrega',
    'El queso llegó derretido por el calor',
    'Cobraron de más en la factura',
    'El pedido llegó a la dirección equivocada'
  ];
  descripciones_sugerencia text[] := array[
    'Sería bueno tener más variedad de quesos',
    'Podrían ofrecer descuentos por compras grandes',
    'Me gustaría que tuvieran leche deslactosada',
    'Estaría bien un programa de fidelización',
    'Podrían entregar los fines de semana también',
    'El servicio estuvo excelente, gracias'
  ];

  cliente_id uuid;
  nombre_cliente text;
  ciudad_cliente text;
  fecha_registro_cliente timestamptz;
  tiene_nombre boolean;
  tiene_ciudad boolean;
  acepto_datos boolean;
  i int;
  j int;
  num_pedidos int;
begin
  for i in 1..50 loop
    -- ~90% completó nombre y ciudad (flujo normal); el resto se quedó a medias, como pasaría
    -- de verdad si alguien no termina de escribir en el chat.
    tiene_nombre := random() < 0.9;
    tiene_ciudad := random() < 0.9;
    acepto_datos := random() < 0.85;
    fecha_registro_cliente := now() - (random() * interval '55 days');

    nombre_cliente := case when tiene_nombre
      then nombres[1 + floor(random() * array_length(nombres, 1))::int] || ' ' ||
           apellidos[1 + floor(random() * array_length(apellidos, 1))::int]
      else null
    end;
    ciudad_cliente := case when tiene_ciudad
      then ciudades[1 + floor(random() * array_length(ciudades, 1))::int]
      else null
    end;

    insert into clientes (telefono, nombre, ciudad, fecha_registro, ultima_interaccion, acepto_tratamiento_datos)
    values (
      '+573000000' || lpad(i::text, 3, '0'),
      nombre_cliente,
      ciudad_cliente,
      fecha_registro_cliente,
      fecha_registro_cliente + (random() * interval '3 days'),
      acepto_datos
    )
    returning id into cliente_id;

    -- ~60% de los clientes hace al menos un pedido; algunos hacen 2 (clientes recurrentes).
    if random() < 0.6 then
      num_pedidos := case when random() < 0.25 then 2 else 1 end;
      for j in 1..num_pedidos loop
        insert into pedidos (cliente_id, producto_interes, ciudad, canal, creado_en)
        values (
          cliente_id,
          '',
          coalesce(ciudad_cliente, 'Otra'),
          case when random() < 0.7 then 'detal' else 'distribucion' end,
          fecha_registro_cliente + (random() * interval '5 days') + (j - 1) * interval '10 days'
        );
      end loop;
    end if;

    -- ~20% de los clientes deja un PQRSF. Si no tenía nombre guardado, el bot real se lo pide en
    -- ese punto (ver ESPERANDO_PQRSF_NOMBRE) — el script hace lo mismo antes de guardar el resto.
    if random() < 0.2 then
      if nombre_cliente is null then
        nombre_cliente := nombres[1 + floor(random() * array_length(nombres, 1))::int] || ' ' ||
                           apellidos[1 + floor(random() * array_length(apellidos, 1))::int];
      end if;

      update clientes
      set nombre = nombre_cliente,
          identificacion = (1000000000 + floor(random() * 900000000))::bigint::text,
          correo = lower(split_part(nombre_cliente, ' ', 1)) || i || '@example.com'
      where id = cliente_id;

      if random() < 0.75 then
        insert into servicio_cliente (cliente_id, descripcion, tipo, creado_en)
        values (
          cliente_id,
          descripciones_pqr[1 + floor(random() * array_length(descripciones_pqr, 1))::int],
          'PQR',
          fecha_registro_cliente + (random() * interval '10 days')
        );
      else
        insert into servicio_cliente (cliente_id, descripcion, tipo, creado_en)
        values (
          cliente_id,
          descripciones_sugerencia[1 + floor(random() * array_length(descripciones_sugerencia, 1))::int],
          'Sugerencia',
          fecha_registro_cliente + (random() * interval '10 days')
        );
      end if;
    end if;
  end loop;
end $$;

-- Para borrar TODOS los datos de prueba sin volver a insertar nada, corre el mismo delete de
-- arriba una vez más:
--   delete from clientes where telefono like '+573000000%';
