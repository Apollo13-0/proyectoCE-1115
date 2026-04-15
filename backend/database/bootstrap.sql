\connect postgres

SELECT 'CREATE DATABASE proyectoce'
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_database
  WHERE datname = 'proyectoce'
)\gexec

\connect proyectoce
\i /opt/db-scripts/creation_script.sql
\i /opt/db-scripts/population_script.sql
