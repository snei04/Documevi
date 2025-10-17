-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: imevi_sgd
-- ------------------------------------------------------
-- Server version	8.0.43-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auditoria`
--

DROP TABLE IF EXISTS `auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `accion` varchar(100) NOT NULL,
  `detalles` text,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `auditoria_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria`
--

LOCK TABLES `auditoria` WRITE;
/*!40000 ALTER TABLE `auditoria` DISABLE KEYS */;
/*!40000 ALTER TABLE `auditoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dependencias`
--

DROP TABLE IF EXISTS `dependencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dependencias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo_dependencia` varchar(20) NOT NULL,
  `nombre_dependencia` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_dependencia` (`codigo_dependencia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dependencias`
--

LOCK TABLES `dependencias` WRITE;
/*!40000 ALTER TABLE `dependencias` DISABLE KEYS */;
/*!40000 ALTER TABLE `dependencias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documento_datos_personalizados`
--

DROP TABLE IF EXISTS `documento_datos_personalizados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documento_datos_personalizados` (
  `id_documento` int NOT NULL,
  `id_campo` int NOT NULL,
  `valor` text NOT NULL,
  PRIMARY KEY (`id_documento`,`id_campo`),
  KEY `id_campo` (`id_campo`),
  CONSTRAINT `documento_datos_personalizados_ibfk_1` FOREIGN KEY (`id_documento`) REFERENCES `documentos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `documento_datos_personalizados_ibfk_2` FOREIGN KEY (`id_campo`) REFERENCES `oficina_campos_personalizados` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documento_datos_personalizados`
--

LOCK TABLES `documento_datos_personalizados` WRITE;
/*!40000 ALTER TABLE `documento_datos_personalizados` DISABLE KEYS */;
/*!40000 ALTER TABLE `documento_datos_personalizados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documento_workflows`
--

DROP TABLE IF EXISTS `documento_workflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documento_workflows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_documento` int NOT NULL,
  `id_workflow` int NOT NULL,
  `id_paso_actual` int NOT NULL,
  `estado` enum('En Progreso','Completado','Rechazado') NOT NULL DEFAULT 'En Progreso',
  `fecha_inicio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin` timestamp NULL DEFAULT NULL,
  `id_usuario_actual` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_documento` (`id_documento`),
  KEY `id_workflow` (`id_workflow`),
  KEY `id_paso_actual` (`id_paso_actual`),
  KEY `id_usuario_actual` (`id_usuario_actual`),
  CONSTRAINT `documento_workflows_ibfk_1` FOREIGN KEY (`id_documento`) REFERENCES `documentos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `documento_workflows_ibfk_2` FOREIGN KEY (`id_workflow`) REFERENCES `workflows` (`id`),
  CONSTRAINT `documento_workflows_ibfk_3` FOREIGN KEY (`id_paso_actual`) REFERENCES `workflow_pasos` (`id`),
  CONSTRAINT `documento_workflows_ibfk_4` FOREIGN KEY (`id_usuario_actual`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documento_workflows`
--

LOCK TABLES `documento_workflows` WRITE;
/*!40000 ALTER TABLE `documento_workflows` DISABLE KEYS */;
/*!40000 ALTER TABLE `documento_workflows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documentos`
--

DROP TABLE IF EXISTS `documentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `radicado` varchar(20) NOT NULL,
  `asunto` text NOT NULL,
  `tipo_soporte` enum('Electrónico','Físico') NOT NULL DEFAULT 'Electrónico',
  `id_oficina_productora` int NOT NULL,
  `id_serie` int NOT NULL,
  `id_subserie` int NOT NULL,
  `remitente_nombre` varchar(255) NOT NULL,
  `remitente_identificacion` varchar(30) DEFAULT NULL,
  `remitente_direccion` varchar(255) DEFAULT NULL,
  `nombre_archivo_original` varchar(255) DEFAULT NULL,
  `path_archivo` varchar(255) DEFAULT NULL,
  `ubicacion_fisica` varchar(255) DEFAULT NULL,
  `contenido_extraido` text,
  `firma_imagen` longtext,
  `firma_hash` varchar(255) DEFAULT NULL,
  `fecha_firma` datetime DEFAULT NULL,
  `id_usuario_radicador` int NOT NULL,
  `fecha_radicado` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `radicado` (`radicado`),
  KEY `id_oficina_productora` (`id_oficina_productora`),
  KEY `id_serie` (`id_serie`),
  KEY `id_subserie` (`id_subserie`),
  KEY `id_usuario_radicador` (`id_usuario_radicador`),
  CONSTRAINT `documentos_ibfk_1` FOREIGN KEY (`id_oficina_productora`) REFERENCES `oficinas_productoras` (`id`),
  CONSTRAINT `documentos_ibfk_2` FOREIGN KEY (`id_serie`) REFERENCES `trd_series` (`id`),
  CONSTRAINT `documentos_ibfk_3` FOREIGN KEY (`id_subserie`) REFERENCES `trd_subseries` (`id`),
  CONSTRAINT `documentos_ibfk_4` FOREIGN KEY (`id_usuario_radicador`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documentos`
--

LOCK TABLES `documentos` WRITE;
/*!40000 ALTER TABLE `documentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `documentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expediente_datos_personalizados`
--

DROP TABLE IF EXISTS `expediente_datos_personalizados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expediente_datos_personalizados` (
  `id_expediente` int NOT NULL,
  `id_campo` int NOT NULL,
  `valor` text NOT NULL,
  PRIMARY KEY (`id_expediente`,`id_campo`),
  KEY `id_campo` (`id_campo`),
  CONSTRAINT `expediente_datos_personalizados_ibfk_2` FOREIGN KEY (`id_campo`) REFERENCES `oficina_campos_personalizados` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expediente_datos_personalizados_ibfk_3` FOREIGN KEY (`id_expediente`) REFERENCES `expedientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expediente_datos_personalizados`
--

LOCK TABLES `expediente_datos_personalizados` WRITE;
/*!40000 ALTER TABLE `expediente_datos_personalizados` DISABLE KEYS */;
/*!40000 ALTER TABLE `expediente_datos_personalizados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expediente_documentos`
--

DROP TABLE IF EXISTS `expediente_documentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expediente_documentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_expediente` int NOT NULL,
  `id_documento` int NOT NULL,
  `orden_foliado` int NOT NULL,
  `requiere_firma` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_incorporacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_expediente` (`id_expediente`,`id_documento`),
  KEY `id_documento` (`id_documento`),
  CONSTRAINT `expediente_documentos_ibfk_1` FOREIGN KEY (`id_expediente`) REFERENCES `expedientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expediente_documentos_ibfk_2` FOREIGN KEY (`id_documento`) REFERENCES `documentos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expediente_documentos`
--

LOCK TABLES `expediente_documentos` WRITE;
/*!40000 ALTER TABLE `expediente_documentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `expediente_documentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expedientes`
--

DROP TABLE IF EXISTS `expedientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expedientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_expediente` varchar(255) NOT NULL,
  `id_serie` int NOT NULL,
  `id_subserie` int NOT NULL,
  `descriptor_1` varchar(100) DEFAULT NULL,
  `descriptor_2` varchar(100) DEFAULT NULL,
  `fecha_apertura` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_cierre` timestamp NULL DEFAULT NULL,
  `estado` enum('En trámite','Cerrado en Gestión','Cerrado en Central') NOT NULL DEFAULT 'En trámite',
  `disponibilidad` enum('Disponible','Prestado','Extraviado') NOT NULL DEFAULT 'Disponible',
  `id_usuario_responsable` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_serie` (`id_serie`),
  KEY `id_subserie` (`id_subserie`),
  KEY `id_usuario_responsable` (`id_usuario_responsable`),
  CONSTRAINT `expedientes_ibfk_1` FOREIGN KEY (`id_serie`) REFERENCES `trd_series` (`id`),
  CONSTRAINT `expedientes_ibfk_2` FOREIGN KEY (`id_subserie`) REFERENCES `trd_subseries` (`id`),
  CONSTRAINT `expedientes_ibfk_3` FOREIGN KEY (`id_usuario_responsable`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expedientes`
--

LOCK TABLES `expedientes` WRITE;
/*!40000 ALTER TABLE `expedientes` DISABLE KEYS */;
/*!40000 ALTER TABLE `expedientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oficina_campos_personalizados`
--

DROP TABLE IF EXISTS `oficina_campos_personalizados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oficina_campos_personalizados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_oficina` int NOT NULL,
  `nombre_campo` varchar(100) NOT NULL,
  `tipo_campo` enum('texto','numero','fecha') NOT NULL DEFAULT 'texto',
  `es_obligatorio` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_oficina` (`id_oficina`,`nombre_campo`),
  CONSTRAINT `oficina_campos_personalizados_ibfk_1` FOREIGN KEY (`id_oficina`) REFERENCES `oficinas_productoras` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oficina_campos_personalizados`
--

LOCK TABLES `oficina_campos_personalizados` WRITE;
/*!40000 ALTER TABLE `oficina_campos_personalizados` DISABLE KEYS */;
/*!40000 ALTER TABLE `oficina_campos_personalizados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oficinas_productoras`
--

DROP TABLE IF EXISTS `oficinas_productoras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oficinas_productoras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_dependencia` int NOT NULL,
  `codigo_oficina` varchar(20) NOT NULL,
  `nombre_oficina` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_oficina` (`codigo_oficina`),
  KEY `id_dependencia` (`id_dependencia`),
  CONSTRAINT `oficinas_productoras_ibfk_1` FOREIGN KEY (`id_dependencia`) REFERENCES `dependencias` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oficinas_productoras`
--

LOCK TABLES `oficinas_productoras` WRITE;
/*!40000 ALTER TABLE `oficinas_productoras` DISABLE KEYS */;
/*!40000 ALTER TABLE `oficinas_productoras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permisos`
--

DROP TABLE IF EXISTS `permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permisos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_permiso` varchar(100) NOT NULL,
  `descripcion` text,
  `grupo` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre_permiso` (`nombre_permiso`)
) ENGINE=InnoDB AUTO_INCREMENT=402 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permisos`
--

LOCK TABLES `permisos` WRITE;
/*!40000 ALTER TABLE `permisos` DISABLE KEYS */;
INSERT INTO `permisos` VALUES (1,'gestionar_usuarios',NULL,'Administración'),(2,'gestionar_roles_permisos',NULL,'Administración'),(3,'ver_auditoria',NULL,'Administración'),(4,'gestionar_parametros_trd',NULL,'Parámetros TRD'),(5,'gestionar_expedientes',NULL,'Expedientes'),(6,'gestionar_prestamos',NULL,'Gestión Documental'),(7,'ver_reportes',NULL,'Reportes'),(8,'gestionar_workflows',NULL,'Gestión Documental'),(9,'gestionar_disposicion_final','Permite la gestión a disposición final','Gestión Documental'),(10,'gestionar_plantillas',NULL,'Gestión Documental'),(11,'ver_expedientes_cerrados',NULL,'Expedientes'),(12,'crear_expedientes','Permite a los usuarios crear nuevos expedientes','Expedientes'),(13,'cerrar_expedientes','Permite a un usuario cambiar el estado de un expediente a cerrado','Expedientes'),(101,'documentos_ver','Permite ver la lista de documentos','Gestión Documental'),(102,'documentos_crear','Permite capturar y subir nuevos documentos','Gestión Documental'),(103,'expedientes_ver','Permite ver la lista de expedientes','Gestión Documental'),(104,'expedientes_crear','Permite crear nuevos expedientes','Gestión Documental'),(105,'expedientes_editar','Permite editar la información de un expediente','Gestión Documental'),(106,'expedientes_cerrar','Permite cerrar un expediente','Gestión Documental'),(107,'prestamos_ver','Permite ver la lista de préstamos','Gestión Documental'),(108,'prestamos_crear','Permite solicitar nuevos préstamos','Gestión Documental'),(109,'prestamos_gestionar','Permite aprobar, rechazar o registrar devoluciones','Gestión Documental'),(201,'dependencias_ver','Permite ver la lista de dependencias','Parametrización'),(202,'dependencias_crear','Permite crear nuevas dependencias','Parametrización'),(203,'dependencias_editar','Permite editar y activar/desactivar dependencias','Parametrización'),(204,'oficinas_ver','Permite ver la lista de oficinas','Parametrización'),(205,'oficinas_crear','Permite crear nuevas oficinas','Parametrización'),(206,'oficinas_editar','Permite editar oficinas','Parametrización'),(207,'series_ver','Permite ver las series','Parametrización'),(208,'series_crear','Permite crear series','Parametrización'),(209,'series_editar','Permite editar series','Parametrización'),(210,'subseries_ver','Permite ver las subseries','Parametrización'),(211,'subseries_crear','Permite crear subseries','Parametrización'),(212,'subseries_editar','Permite editar subseries','Parametrización'),(213,'campos_personalizados_gestionar','Permite crear y editar campos personalizados','Parametrización'),(214,'workflows_gestionar','Permite crear y editar flujos de trabajo','Parametrización'),(215,'plantillas_gestionar','Permite crear y editar plantillas de documentos','Parametrización'),(301,'transferencias_gestionar','Permite gestionar transferencias documentales','Administración'),(302,'eliminacion_gestionar','Permite gestionar la eliminación de documentos','Administración'),(303,'roles_ver','Permite ver la lista de roles','Administración'),(304,'roles_crear','Permite crear nuevos roles','Administración'),(305,'roles_editar','Permite editar roles y asignar permisos','Administración'),(306,'roles_eliminar','Permite eliminar roles','Administración'),(307,'permisos_maestro_ver','Permite ver la descripción de todos los permisos','Administración'),(308,'permisos_maestro_editar','Permite editar la descripción de los permisos','Administración'),(309,'usuarios_ver','Permite ver la lista de usuarios','Administración'),(310,'usuarios_invitar','Permite invitar nuevos usuarios','Administración'),(311,'usuarios_editar','Permite cambiar el rol y estado de los usuarios','Administración'),(312,'auditoria_ver','Permite acceder al log de auditoría','Administración'),(313,'reportes_fuid_ver','Permite generar y ver el reporte FUID','Administración'),(314,'estadisticas_ver','Permite ver el dashboard de estadísticas','Administración'),(327,'dependencias_inactivar','Activar/desactivar dependencias','Parametrización'),(331,'oficinas_inactivar','Activar/desactivar oficinas','Parametrización'),(335,'series_inactivar','Activar/desactivar series','Parametrización'),(339,'subseries_inactivar','Activar/desactivar subseries','Parametrización'),(343,'campos_ver','Ver campos personalizados','Parametrización'),(344,'campos_crear','Crear nuevos campos personalizados','Parametrización'),(345,'campos_editar','Editar campos personalizados','Parametrización'),(346,'campos_eliminar','Eliminar campos personalizados','Parametrización'),(347,'expedientes_agregar_documentos','Agregar documentos a expedientes','Gestión Documental'),(348,'expedientes_custom_data','Editar datos personalizados de expedientes','Gestión Documental'),(353,'documentos_editar','Editar documentos existentes','Gestión Documental'),(354,'documentos_firmar','Firmar documentos','Gestión Documental'),(355,'documentos_workflow','Iniciar y avanzar workflows en documentos','Gestión Documental'),(358,'workflows_ver','Ver workflows disponibles','Parametrización'),(359,'workflows_crear','Crear nuevos workflows','Parametrización'),(360,'workflows_editar','Editar workflows existentes','Parametrización'),(361,'workflows_eliminar','Eliminar workflows','Parametrización'),(362,'workflows_ejecutar','Ejecutar pasos de workflows','Gestión Documental'),(363,'plantillas_ver','Ver plantillas de documentos','Parametrización'),(364,'plantillas_crear','Crear nuevas plantillas','Parametrización'),(365,'plantillas_editar','Editar plantillas existentes','Parametrización'),(366,'plantillas_disenar','Usar diseñador visual de plantillas','Parametrización'),(367,'plantillas_eliminar','Eliminar plantillas','Parametrización'),(368,'prestamos_solicitar','Solicitar préstamos de expedientes','Gestión Documental'),(369,'prestamos_aprobar','Aprobar/rechazar solicitudes de préstamo','Gestión Documental'),(370,'prestamos_devolver','Registrar devolución de préstamos','Gestión Documental'),(371,'prestamos_prorrogar','Aprobar prórrogas de préstamos','Gestión Documental'),(373,'usuarios_crear','Crear nuevos usuarios','Administración'),(374,'usuarios_inactivar','Activar/desactivar usuarios','Administración'),(382,'permisos_ver','Ver lista de permisos','Administración'),(383,'permisos_crear','Crear nuevos permisos','Administración'),(384,'permisos_editar','Editar permisos existentes','Administración'),(385,'permisos_asignar','Asignar permisos a roles','Administración'),(386,'transferencias_ver','Ver lista de transferencias documentales','Administración'),(387,'transferencias_crear','Crear solicitudes de transferencia','Administración'),(388,'transferencias_aprobar','Aprobar/rechazar transferencias','Administración'),(389,'transferencias_ejecutar','Ejecutar transferencias aprobadas','Administración'),(390,'eliminacion_ver','Ver lista de solicitudes de eliminación','Administración'),(391,'eliminacion_crear','Crear solicitudes de eliminación','Administración'),(392,'eliminacion_aprobar','Aprobar/rechazar eliminaciones','Administración'),(393,'eliminacion_ejecutar','Ejecutar eliminaciones aprobadas','Administración'),(394,'auditoria_exportar','Exportar registros de auditoría','Administración'),(396,'reportes_ver','Ver reportes del sistema','Administración'),(397,'reportes_fuid','Generar reporte FUID','Administración'),(399,'busqueda_basica','Realizar búsquedas básicas','Gestión Documental'),(400,'busqueda_avanzada','Realizar búsquedas avanzadas','Gestión Documental');
/*!40000 ALTER TABLE `permisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plantilla_campos`
--

DROP TABLE IF EXISTS `plantilla_campos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantilla_campos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_plantilla` int NOT NULL,
  `nombre_campo` varchar(100) NOT NULL,
  `tipo_campo` enum('texto','numero','fecha') NOT NULL DEFAULT 'texto',
  `orden` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_plantilla` (`id_plantilla`,`nombre_campo`),
  CONSTRAINT `plantilla_campos_ibfk_1` FOREIGN KEY (`id_plantilla`) REFERENCES `plantillas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plantilla_campos`
--

LOCK TABLES `plantilla_campos` WRITE;
/*!40000 ALTER TABLE `plantilla_campos` DISABLE KEYS */;
/*!40000 ALTER TABLE `plantilla_campos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plantillas`
--

DROP TABLE IF EXISTS `plantillas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantillas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `diseño_json` longtext,
  `id_oficina_productora` int DEFAULT NULL,
  `id_serie` int DEFAULT NULL,
  `id_subserie` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plantillas`
--

LOCK TABLES `plantillas` WRITE;
/*!40000 ALTER TABLE `plantillas` DISABLE KEYS */;
/*!40000 ALTER TABLE `plantillas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prestamos`
--

DROP TABLE IF EXISTS `prestamos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prestamos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_expediente` int NOT NULL,
  `id_usuario_solicitante` int NOT NULL,
  `tipo_prestamo` enum('Físico','Electrónico') NOT NULL DEFAULT 'Electrónico',
  `fecha_solicitud` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_devolucion_prevista` date DEFAULT NULL,
  `fecha_devolucion_real` date DEFAULT NULL,
  `estado` enum('Solicitado','Prestado','Devuelto','Vencido') NOT NULL DEFAULT 'Solicitado',
  `observaciones` text,
  `prorrogas_solicitadas` int NOT NULL DEFAULT '0',
  `dev_folios_confirmados` int DEFAULT NULL,
  `dev_estado_conservacion` varchar(50) DEFAULT NULL,
  `dev_inconsistencias` text,
  PRIMARY KEY (`id`),
  KEY `id_expediente` (`id_expediente`),
  KEY `id_usuario_solicitante` (`id_usuario_solicitante`),
  CONSTRAINT `prestamos_ibfk_1` FOREIGN KEY (`id_expediente`) REFERENCES `expedientes` (`id`),
  CONSTRAINT `prestamos_ibfk_2` FOREIGN KEY (`id_usuario_solicitante`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prestamos`
--

LOCK TABLES `prestamos` WRITE;
/*!40000 ALTER TABLE `prestamos` DISABLE KEYS */;
/*!40000 ALTER TABLE `prestamos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol_permisos`
--

DROP TABLE IF EXISTS `rol_permisos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol_permisos` (
  `id_rol` int NOT NULL,
  `id_permiso` int NOT NULL,
  PRIMARY KEY (`id_rol`,`id_permiso`),
  KEY `id_permiso` (`id_permiso`),
  CONSTRAINT `rol_permisos_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rol_permisos_ibfk_2` FOREIGN KEY (`id_permiso`) REFERENCES `permisos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol_permisos`
--

LOCK TABLES `rol_permisos` WRITE;
/*!40000 ALTER TABLE `rol_permisos` DISABLE KEYS */;
/*!40000 ALTER TABLE `rol_permisos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trd_series`
--

DROP TABLE IF EXISTS `trd_series`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trd_series` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_oficina_productora` int NOT NULL,
  `codigo_serie` varchar(20) NOT NULL,
  `nombre_serie` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `requiere_subserie` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_oficina_productora` (`id_oficina_productora`,`codigo_serie`),
  CONSTRAINT `trd_series_ibfk_1` FOREIGN KEY (`id_oficina_productora`) REFERENCES `oficinas_productoras` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trd_series`
--

LOCK TABLES `trd_series` WRITE;
/*!40000 ALTER TABLE `trd_series` DISABLE KEYS */;
/*!40000 ALTER TABLE `trd_series` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trd_subseries`
--

DROP TABLE IF EXISTS `trd_subseries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trd_subseries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_serie` int NOT NULL,
  `codigo_subserie` varchar(20) NOT NULL,
  `nombre_subserie` varchar(255) NOT NULL,
  `retencion_gestion` int DEFAULT NULL,
  `retencion_central` int DEFAULT NULL,
  `disposicion_final` enum('Conservación Total','Eliminación','Selección') DEFAULT NULL,
  `procedimientos` text,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_serie` (`id_serie`,`codigo_subserie`),
  CONSTRAINT `trd_subseries_ibfk_1` FOREIGN KEY (`id_serie`) REFERENCES `trd_series` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trd_subseries`
--

LOCK TABLES `trd_subseries` WRITE;
/*!40000 ALTER TABLE `trd_subseries` DISABLE KEYS */;
/*!40000 ALTER TABLE `trd_subseries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_completo` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `documento` varchar(20) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `rol_id` int DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '0',
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_expires` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `documento` (`documento`),
  KEY `rol_id` (`rol_id`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflow_pasos`
--

DROP TABLE IF EXISTS `workflow_pasos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_pasos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_workflow` int NOT NULL,
  `nombre_paso` varchar(255) NOT NULL,
  `orden` int NOT NULL,
  `id_rol_responsable` int NOT NULL,
  `requiere_firma` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_workflow` (`id_workflow`,`orden`),
  KEY `id_rol_responsable` (`id_rol_responsable`),
  CONSTRAINT `workflow_pasos_ibfk_1` FOREIGN KEY (`id_workflow`) REFERENCES `workflows` (`id`) ON DELETE CASCADE,
  CONSTRAINT `workflow_pasos_ibfk_2` FOREIGN KEY (`id_rol_responsable`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflow_pasos`
--

LOCK TABLES `workflow_pasos` WRITE;
/*!40000 ALTER TABLE `workflow_pasos` DISABLE KEYS */;
/*!40000 ALTER TABLE `workflow_pasos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflows`
--

DROP TABLE IF EXISTS `workflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflows`
--

LOCK TABLES `workflows` WRITE;
/*!40000 ALTER TABLE `workflows` DISABLE KEYS */;
/*!40000 ALTER TABLE `workflows` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-11  8:37:13
