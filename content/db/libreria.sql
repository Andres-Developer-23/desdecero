-- Base de datos de práctica de la ruta «Bases de datos con SQL».
-- Cada ejecución la crea de nuevo con este script al abrir libreria.db.

CREATE TABLE autores (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  pais TEXT NOT NULL
);

CREATE TABLE libros (
  id INTEGER PRIMARY KEY,
  titulo TEXT NOT NULL,
  autor_id INTEGER NOT NULL REFERENCES autores (id),
  categoria TEXT NOT NULL,
  precio INTEGER NOT NULL,
  paginas INTEGER,
  publicado INTEGER,
  stock INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE clientes (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  email TEXT UNIQUE
);

CREATE TABLE ventas (
  id INTEGER PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes (id),
  libro_id INTEGER NOT NULL REFERENCES libros (id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  fecha TEXT NOT NULL
);

INSERT INTO autores (id, nombre, pais) VALUES
  (1, 'Marta Ibáñez', 'Colombia'),
  (2, 'Andrés Quintero', 'Colombia'),
  (3, 'Lucía Restrepo', 'Colombia'),
  (4, 'Tomás Beltrán', 'Argentina'),
  (5, 'Clara Montoya', 'México'),
  (6, 'Julián Ortega', 'Perú'),
  (7, 'Sofía Cárdenas', 'Chile'),
  (8, 'Elena Vargas', 'España'),
  (9, 'Diego Salazar', 'México'),
  (10, 'Paula Méndez', 'Argentina'),
  (11, 'Natalia Rojas', 'Colombia');

INSERT INTO libros (id, titulo, autor_id, categoria, precio, paginas, publicado, stock) VALUES
  (1, 'El faro de la niebla', 1, 'Novela', 45900, 312, 2021, 7),
  (2, 'Python para curiosos', 2, 'Programación', 68500, 280, 2024, 12),
  (3, 'Cartas desde el páramo', 3, 'Novela', 39900, 198, 2019, 0),
  (4, 'La aritmética de las nubes', 4, 'Ciencia ficción', 52000, 356, 2022, 3),
  (5, 'Versos para un lunes', 5, 'Poesía', 28500, 96, 2020, 9),
  (6, 'Breve historia del café en los Andes', 6, 'Historia', 61200, 420, 2018, 4),
  (7, 'El robot que aprendió a dormir', 7, 'Infantil', 34900, 48, 2023, 15),
  (8, 'Datos limpios, mentes tranquilas', 2, 'Programación', 74000, 344, 2025, 6),
  (9, 'La ciudad de los relojes parados', 8, 'Novela', 47500, 275, 2020, 2),
  (10, 'Mapas de un planeta sin nombre', 9, 'Ciencia ficción', 55800, 390, 2017, 0),
  (11, 'Canciones del río Magdalena', 5, 'Poesía', 31000, 120, 2022, 5),
  (12, 'Los puentes de piedra y otras crónicas de viaje por la cordillera', 6, 'Historia', 88900, 512, 2016, 1),
  (13, 'Un dragón en la biblioteca', 7, 'Infantil', 29900, 40, 2021, 11),
  (14, 'Algoritmos para la vida diaria', 10, 'Programación', 63000, 260, 2023, 0),
  (15, 'La última estación', 1, 'Novela', 42000, 288, 2024, 8),
  (16, 'Señales desde Europa', 4, 'Ciencia ficción', 49500, 330, 2019, 4),
  (17, 'Pequeño atlas de pájaros urbanos', 11, 'Naturaleza', 57300, 180, 2022, 2),
  (18, 'El arte de hacer preguntas', 10, 'Ensayo', 36800, 152, 2021, 10);

INSERT INTO clientes (id, nombre, ciudad, email) VALUES
  (1, 'Ana Ruiz', 'Bogotá', 'ana.ruiz@correo.example'),
  (2, 'Luis Mora', 'Medellín', 'luis.mora@correo.example'),
  (3, 'Sofía Gómez', 'Cali', 'sofia.gomez@correo.example'),
  (4, 'Carlos Pérez', 'Bogotá', 'carlos.perez@correo.example'),
  (5, 'Valentina Ríos', 'Barranquilla', NULL),
  (6, 'Mateo Herrera', 'Medellín', 'mateo.herrera@correo.example'),
  (7, 'Isabel Castro', 'Pasto', 'isabel.castro@correo.example'),
  (8, 'Jorge Navarro', 'Bogotá', NULL),
  (9, 'Daniela Vega', 'Cali', 'daniela.vega@correo.example'),
  (10, 'Andrés Silva', 'Bucaramanga', 'andres.silva@correo.example');

INSERT INTO ventas (id, cliente_id, libro_id, cantidad, fecha) VALUES
  (1, 2, 17, 2, '2026-09-01'),
  (2, 1, 15, 1, '2026-09-02'),
  (3, 2, 14, 3, '2026-09-03'),
  (4, 2, 7, 3, '2026-09-05'),
  (5, 2, 2, 1, '2026-09-06'),
  (6, 1, 13, 1, '2026-09-08'),
  (7, 6, 15, 1, '2026-09-09'),
  (8, 1, 7, 2, '2026-09-11'),
  (9, 7, 5, 1, '2026-09-12'),
  (10, 6, 18, 1, '2026-09-14'),
  (11, 9, 15, 2, '2026-09-15'),
  (12, 2, 17, 1, '2026-09-17'),
  (13, 1, 4, 1, '2026-09-18'),
  (14, 10, 1, 2, '2026-09-20'),
  (15, 2, 4, 1, '2026-09-21'),
  (16, 7, 18, 1, '2026-09-23'),
  (17, 9, 13, 1, '2026-09-24'),
  (18, 2, 7, 3, '2026-09-26'),
  (19, 2, 14, 2, '2026-09-27'),
  (20, 2, 7, 1, '2026-09-29'),
  (21, 1, 6, 3, '2026-09-30'),
  (22, 9, 7, 2, '2026-10-01'),
  (23, 1, 2, 2, '2026-10-03'),
  (24, 4, 1, 3, '2026-10-04'),
  (25, 1, 15, 2, '2026-10-06'),
  (26, 2, 14, 1, '2026-10-07'),
  (27, 3, 7, 1, '2026-10-09'),
  (28, 2, 2, 2, '2026-10-10'),
  (29, 10, 6, 2, '2026-10-12'),
  (30, 9, 4, 2, '2026-10-13'),
  (31, 4, 15, 2, '2026-10-15'),
  (32, 10, 9, 1, '2026-10-16'),
  (33, 4, 4, 3, '2026-10-18'),
  (34, 6, 2, 1, '2026-10-19'),
  (35, 3, 2, 3, '2026-10-21'),
  (36, 1, 7, 1, '2026-10-22'),
  (37, 4, 6, 2, '2026-10-24'),
  (38, 10, 2, 2, '2026-10-25'),
  (39, 10, 14, 2, '2026-10-27'),
  (40, 4, 7, 3, '2026-10-28');
