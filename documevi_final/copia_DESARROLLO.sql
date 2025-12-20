-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: imevi_sgd
-- ------------------------------------------------------
-- Server version	8.0.44-0ubuntu0.24.04.1

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
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria`
--

LOCK TABLES `auditoria` WRITE;
/*!40000 ALTER TABLE `auditoria` DISABLE KEYS */;
INSERT INTO `auditoria` VALUES (1,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-13 17:06:05'),(2,5,'ACTUALIZACION_PERMISOS','Se modificaron los permisos para el rol con ID: 2','2025-10-13 17:07:04'),(4,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-13 17:12:08'),(7,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-13 17:13:51'),(9,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-13 17:30:23'),(10,5,'ACTUALIZACION_PERMISOS','Se modificaron los permisos para el rol con ID: 2','2025-10-13 17:30:55'),(12,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-13 18:09:51'),(13,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-13 18:11:57'),(14,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-17 20:33:25'),(15,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:12:16'),(16,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:12:28'),(17,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:13:52'),(18,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:14:12'),(19,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:14:19'),(20,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:47:55'),(21,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:48:22'),(22,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:48:24'),(23,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:48:37'),(24,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:49:43'),(25,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:50:36'),(26,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:54:15'),(27,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:55:07'),(28,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:56:22'),(29,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:56:47'),(30,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:57:28'),(31,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 20:58:22'),(32,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-20 21:02:43'),(33,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-21 23:00:05'),(34,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-21 23:01:15'),(35,8,'LOGIN_EXITOSO','El usuario con documento 1018465545 inició sesión.','2025-10-21 23:02:39'),(36,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-21 23:03:08'),(37,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-21 23:21:26'),(38,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-22 13:41:47'),(39,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-22 16:22:11'),(40,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-10-22 23:01:35'),(41,8,'LOGIN_EXITOSO','El usuario con documento 1018465545 inició sesión.','2025-12-09 20:21:42'),(42,8,'LOGIN_EXITOSO','El usuario con documento 1018465545 inició sesión.','2025-12-09 20:27:28'),(43,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-12-09 20:33:28'),(44,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-12-09 20:58:20'),(45,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-12-09 21:01:19'),(46,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-12-10 20:29:47'),(47,8,'LOGIN_EXITOSO','El usuario con documento 1018465545 inició sesión.','2025-12-11 00:06:10'),(48,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-12-11 00:06:26'),(49,5,'CIERRE_EXPEDIENTE','El usuario cerró el expediente con ID 1','2025-12-11 00:11:33'),(50,8,'LOGIN_EXITOSO','El usuario con documento 1018465545 inició sesión.','2025-12-19 15:18:07'),(51,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-12-19 15:18:20'),(52,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-12-19 15:46:36'),(53,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-12-20 12:22:00'),(54,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-12-20 12:59:53'),(55,5,'LOGIN_EXITOSO','El usuario con documento 1010101010 inició sesión.','2025-12-20 13:02:43');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dependencias`
--

LOCK TABLES `dependencias` WRITE;
/*!40000 ALTER TABLE `dependencias` DISABLE KEYS */;
INSERT INTO `dependencias` VALUES (1,'1','prueba',1),(2,'001','Dependencia Ejemplo 1',1),(3,'002','Dependencia Ejemplo 2',1);
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
INSERT INTO `documento_datos_personalizados` VALUES (4,1,'asdasdasdasd'),(4,2,'asdasdasdasdasd');
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
  `tipo_soporte` enum('Electrónico','Físico','Híbrido') NOT NULL DEFAULT 'Electrónico',
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documentos`
--

LOCK TABLES `documentos` WRITE;
/*!40000 ALTER TABLE `documentos` DISABLE KEYS */;
INSERT INTO `documentos` VALUES (1,'20251017-0001','Es un documento de prueba para saber la firma electronica','Electrónico',1,1,1,'sneider','11513213','13215','book-summary.pdf','uploads/archivo-1760741301070-830421556.pdf',NULL,NULL,NULL,NULL,NULL,5,'2025-10-17 22:48:21'),(2,'20251017-0002','Es una prueba adicional','Electrónico',1,1,1,'asdadasddas','asdasdas','asdasdad','Captura de pantalla 2025-10-17 125003.png','uploads/archivo-1760743217100-807452255.png',NULL,NULL,NULL,NULL,NULL,5,'2025-10-17 23:20:17'),(3,'20251021-0001','Prueba_hoja - Generado desde plantilla','Electrónico',1,1,1,'Generado Internamente',NULL,NULL,'20251021-0001.pdf','uploads/20251021-0001.pdf',NULL,NULL,NULL,NULL,NULL,5,'2025-10-21 23:07:40'),(4,'20251210-0001','asdasdasdasdasdasdadasdasddasdas','Físico',2,3,4,'asdasdasdas','asdasd','asdasdad',NULL,NULL,'asdasdasdasdasdasdasdasdasd',NULL,NULL,NULL,NULL,5,'2025-12-11 00:19:18');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expediente_documentos`
--

LOCK TABLES `expediente_documentos` WRITE;
/*!40000 ALTER TABLE `expediente_documentos` DISABLE KEYS */;
INSERT INTO `expediente_documentos` VALUES (1,1,1,1,1,'2025-10-17 23:21:10'),(2,1,2,2,0,'2025-10-20 21:01:58'),(3,1,3,3,0,'2025-10-21 23:07:40'),(4,3,4,1,0,'2025-12-11 00:19:33');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expedientes`
--

LOCK TABLES `expedientes` WRITE;
/*!40000 ALTER TABLE `expedientes` DISABLE KEYS */;
INSERT INTO `expedientes` VALUES (1,'Expediente prueba',1,1,'','','2025-10-17 22:41:23','2025-12-11 00:11:33','Cerrado en Gestión','Disponible',5),(2,'pruebas',1,1,'','','2025-12-11 00:17:14',NULL,'En trámite','Disponible',5),(3,'deadasdads',1,5,'','','2025-12-11 00:18:31',NULL,'En trámite','Disponible',5);
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oficina_campos_personalizados`
--

LOCK TABLES `oficina_campos_personalizados` WRITE;
/*!40000 ALTER TABLE `oficina_campos_personalizados` DISABLE KEYS */;
INSERT INTO `oficina_campos_personalizados` VALUES (1,2,'preubas','texto',0),(2,2,'pruebas 2','numero',0);
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oficinas_productoras`
--

LOCK TABLES `oficinas_productoras` WRITE;
/*!40000 ALTER TABLE `oficinas_productoras` DISABLE KEYS */;
INSERT INTO `oficinas_productoras` VALUES (1,1,'1','prueba_oficina',1),(2,2,'001-01','Oficina Ejemplo 1',1),(3,2,'001-02','Oficina Ejemplo 2',1),(4,3,'002-01','Oficina Ejemplo 3',1);
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
) ENGINE=InnoDB AUTO_INCREMENT=404 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permisos`
--

LOCK TABLES `permisos` WRITE;
/*!40000 ALTER TABLE `permisos` DISABLE KEYS */;
INSERT INTO `permisos` VALUES (1,'gestionar_usuarios',NULL,'Administración'),(2,'gestionar_roles_permisos',NULL,'Administración'),(3,'ver_auditoria',NULL,'Administración'),(4,'gestionar_parametros_trd',NULL,'Parámetros TRD'),(5,'gestionar_expedientes',NULL,'Expedientes'),(6,'gestionar_prestamos',NULL,'Gestión Documental'),(7,'ver_reportes',NULL,'Reportes'),(8,'gestionar_workflows',NULL,'Gestión Documental'),(9,'gestionar_disposicion_final','Permite la gestión a disposición final','Gestión Documental'),(10,'gestionar_plantillas',NULL,'Gestión Documental'),(11,'ver_expedientes_cerrados',NULL,'Expedientes'),(12,'crear_expedientes','Permite a los usuarios crear nuevos expedientes','Expedientes'),(13,'cerrar_expedientes','Permite a un usuario cambiar el estado de un expediente a cerrado','Expedientes'),(101,'documentos_ver','Permite ver la lista de documentos','Gestión Documental'),(102,'documentos_crear','Permite capturar y subir nuevos documentos','Gestión Documental'),(103,'expedientes_ver','Permite ver la lista de expedientes','Gestión Documental'),(104,'expedientes_crear','Permite crear nuevos expedientes','Gestión Documental'),(105,'expedientes_editar','Permite editar la información de un expediente','Gestión Documental'),(106,'expedientes_cerrar','Permite cerrar un expediente','Gestión Documental'),(107,'prestamos_ver','Permite ver la lista de préstamos','Gestión Documental'),(108,'prestamos_crear','Permite solicitar nuevos préstamos','Gestión Documental'),(109,'prestamos_gestionar','Permite aprobar, rechazar o registrar devoluciones','Gestión Documental'),(201,'dependencias_ver','Permite ver la lista de dependencias','Parametrización'),(202,'dependencias_crear','Permite crear nuevas dependencias','Parametrización'),(203,'dependencias_editar','Permite editar y activar/desactivar dependencias','Parametrización'),(204,'oficinas_ver','Permite ver la lista de oficinas','Parametrización'),(205,'oficinas_crear','Permite crear nuevas oficinas','Parametrización'),(206,'oficinas_editar','Permite editar oficinas','Parametrización'),(207,'series_ver','Permite ver las series','Parametrización'),(208,'series_crear','Permite crear series','Parametrización'),(209,'series_editar','Permite editar series','Parametrización'),(210,'subseries_ver','Permite ver las subseries','Parametrización'),(211,'subseries_crear','Permite crear subseries','Parametrización'),(212,'subseries_editar','Permite editar subseries','Parametrización'),(213,'campos_personalizados_gestionar','Permite crear y editar campos personalizados','Parametrización'),(214,'workflows_gestionar','Permite crear y editar flujos de trabajo','Parametrización'),(215,'plantillas_gestionar','Permite crear y editar plantillas de documentos','Parametrización'),(301,'transferencias_gestionar','Permite gestionar transferencias documentales','Administración'),(302,'eliminacion_gestionar','Permite gestionar la eliminación de documentos','Administración'),(303,'roles_ver','Permite ver la lista de roles','Administración'),(304,'roles_crear','Permite crear nuevos roles','Administración'),(305,'roles_editar','Permite editar roles y asignar permisos','Administración'),(306,'roles_eliminar','Permite eliminar roles','Administración'),(307,'permisos_maestro_ver','Permite ver la descripción de todos los permisos','Administración'),(308,'permisos_maestro_editar','Permite editar la descripción de los permisos','Administración'),(309,'usuarios_ver','Permite ver la lista de usuarios','Administración'),(310,'usuarios_invitar','Permite invitar nuevos usuarios','Administración'),(311,'usuarios_editar','Permite cambiar el rol y estado de los usuarios','Administración'),(312,'auditoria_ver','Permite acceder al log de auditoría','Administración'),(313,'reportes_fuid_ver','Permite generar y ver el reporte FUID','Administración'),(314,'estadisticas_ver','Permite ver el dashboard de estadísticas','Administración'),(327,'dependencias_inactivar','Activar/desactivar dependencias','Parametrización'),(331,'oficinas_inactivar','Activar/desactivar oficinas','Parametrización'),(335,'series_inactivar','Activar/desactivar series','Parametrización'),(339,'subseries_inactivar','Activar/desactivar subseries','Parametrización'),(343,'campos_ver','Ver campos personalizados','Parametrización'),(344,'campos_crear','Crear nuevos campos personalizados','Parametrización'),(345,'campos_editar','Editar campos personalizados','Parametrización'),(346,'campos_eliminar','Eliminar campos personalizados','Parametrización'),(347,'expedientes_agregar_documentos','Agregar documentos a expedientes','Gestión Documental'),(348,'expedientes_custom_data','Editar datos personalizados de expedientes','Gestión Documental'),(353,'documentos_editar','Editar documentos existentes','Gestión Documental'),(354,'documentos_firmar','Firmar documentos','Gestión Documental'),(355,'documentos_workflow','Iniciar y avanzar workflows en documentos','Gestión Documental'),(358,'workflows_ver','Ver workflows disponibles','Parametrización'),(359,'workflows_crear','Crear nuevos workflows','Parametrización'),(360,'workflows_editar','Editar workflows existentes','Parametrización'),(361,'workflows_eliminar','Eliminar workflows','Parametrización'),(362,'workflows_ejecutar','Ejecutar pasos de workflows','Gestión Documental'),(363,'plantillas_ver','Ver plantillas de documentos','Parametrización'),(364,'plantillas_crear','Crear nuevas plantillas','Parametrización'),(365,'plantillas_editar','Editar plantillas existentes','Parametrización'),(366,'plantillas_disenar','Usar diseñador visual de plantillas','Parametrización'),(367,'plantillas_eliminar','Eliminar plantillas','Parametrización'),(368,'prestamos_solicitar','Solicitar préstamos de expedientes','Gestión Documental'),(369,'prestamos_aprobar','Aprobar/rechazar solicitudes de préstamo','Gestión Documental'),(370,'prestamos_devolver','Registrar devolución de préstamos','Gestión Documental'),(371,'prestamos_prorrogar','Aprobar prórrogas de préstamos','Gestión Documental'),(373,'usuarios_crear','Crear nuevos usuarios','Administración'),(374,'usuarios_inactivar','Activar/desactivar usuarios','Administración'),(382,'permisos_ver','Ver lista de permisos','Administración'),(383,'permisos_crear','Crear nuevos permisos','Administración'),(384,'permisos_editar','Editar permisos existentes','Administración'),(385,'permisos_asignar','Asignar permisos a roles','Administración'),(386,'transferencias_ver','Ver lista de transferencias documentales','Administración'),(387,'transferencias_crear','Crear solicitudes de transferencia','Administración'),(388,'transferencias_aprobar','Aprobar/rechazar transferencias','Administración'),(389,'transferencias_ejecutar','Ejecutar transferencias aprobadas','Administración'),(390,'eliminacion_ver','Ver lista de solicitudes de eliminación','Administración'),(391,'eliminacion_crear','Crear solicitudes de eliminación','Administración'),(392,'eliminacion_aprobar','Aprobar/rechazar eliminaciones','Administración'),(393,'eliminacion_ejecutar','Ejecutar eliminaciones aprobadas','Administración'),(394,'auditoria_exportar','Exportar registros de auditoría','Administración'),(396,'reportes_ver','Ver reportes del sistema','Administración'),(397,'reportes_fuid','Generar reporte FUID','Administración'),(399,'busqueda_basica','Realizar búsquedas básicas','Gestión Documental'),(400,'busqueda_avanzada','Realizar búsquedas avanzadas','Gestión Documental'),(402,'retencion_ver','Ver expedientes con retención vencida','Retención Documental'),(403,'retencion_procesar','Procesar expedientes vencidos (conservar/eliminar)','Retención Documental');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plantilla_campos`
--

LOCK TABLES `plantilla_campos` WRITE;
/*!40000 ALTER TABLE `plantilla_campos` DISABLE KEYS */;
INSERT INTO `plantilla_campos` VALUES (1,1,'Prueba_1','texto',1);
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plantillas`
--

LOCK TABLES `plantillas` WRITE;
/*!40000 ALTER TABLE `plantillas` DISABLE KEYS */;
INSERT INTO `plantillas` VALUES (1,'Prueba_hoja','Es una prueba','2025-10-21 23:04:39','{\"dataSources\":[],\"assets\":[],\"styles\":[{\"selectors\":[{\"name\":\"gjs-row\",\"private\":1}],\"style\":{\"display\":\"flex\",\"justify-content\":\"flex-start\",\"align-items\":\"stretch\",\"flex-wrap\":\"nowrap\",\"padding-top\":\"10px\",\"padding-right\":\"10px\",\"padding-bottom\":\"10px\",\"padding-left\":\"10px\"}},{\"selectors\":[{\"name\":\"gjs-row\",\"private\":1}],\"style\":{\"flex-wrap\":\"wrap\"},\"mediaText\":\"(max-width: 768px)\",\"atRuleType\":\"media\"},{\"selectors\":[{\"name\":\"gjs-cell\",\"private\":1}],\"style\":{\"min-height\":\"75px\",\"flex-grow\":\"1\",\"flex-basis\":\"100%\"}},{\"selectors\":[\"variable-placeholder\"],\"style\":{\"color\":\"black\",\"font-weight\":\"700\",\"font-size\":\"50px\",\"border\":\"0px solid #a43838\"}}],\"pages\":[{\"frames\":[{\"component\":{\"type\":\"wrapper\",\"stylable\":[\"background\",\"background-color\",\"background-image\",\"background-repeat\",\"background-attachment\",\"background-position\",\"background-size\"],\"attributes\":{\"id\":\"ivlf\"},\"components\":[{\"name\":\"Row\",\"droppable\":\".gjs-cell\",\"resizable\":{\"tl\":0,\"tc\":0,\"tr\":0,\"cl\":0,\"cr\":0,\"bl\":0,\"br\":0,\"minDim\":1},\"classes\":[{\"name\":\"gjs-row\",\"private\":1}],\"attributes\":{\"id\":\"i9m4\"},\"components\":[{\"name\":\"Cell\",\"draggable\":\".gjs-row\",\"stylable-require\":[\"flex-basis\"],\"unstylable\":[\"width\"],\"resizable\":{\"tl\":0,\"tc\":0,\"tr\":0,\"cl\":0,\"cr\":1,\"bl\":0,\"br\":0,\"minDim\":1,\"bc\":0,\"currentUnit\":1,\"step\":0.2,\"keyWidth\":\"flex-basis\"},\"classes\":[{\"name\":\"gjs-cell\",\"private\":1}],\"components\":[{\"tagName\":\"span\",\"type\":\"text\",\"classes\":[\"variable-placeholder\"],\"components\":[{\"type\":\"textnode\",\"content\":\"{{Prueba_1}}\"}]}]}]}],\"head\":{\"type\":\"head\"},\"docEl\":{\"tagName\":\"html\"}},\"id\":\"jKgAjzdecI4p5GSn\"}],\"type\":\"main\",\"id\":\"8yl9TjWRvG3AbM6a\"}],\"symbols\":[],\"html\":\"<body id=\\\"ivlf\\\"><div class=\\\"gjs-row\\\" id=\\\"i9m4\\\"><div class=\\\"gjs-cell\\\"><span class=\\\"variable-placeholder\\\">{{Prueba_1}}</span></div></div></body>\",\"css\":\"* { box-sizing: border-box; } body {margin: 0;}.gjs-row{display:flex;justify-content:flex-start;align-items:stretch;flex-wrap:nowrap;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;}.gjs-cell{min-height:75px;flex-grow:1;flex-basis:100%;}.variable-placeholder{color:black;font-weight:700;font-size:50px;border:0px solid #a43838;}@media (max-width: 768px){.gjs-row{flex-wrap:wrap;}}\"}',1,1,1);
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
-- Table structure for table `retencion_notificaciones`
--

DROP TABLE IF EXISTS `retencion_notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `retencion_notificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_expediente` int NOT NULL,
  `tipo_retencion` enum('Gestión','Central') NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `disposicion_final` enum('Conservación Total','Eliminación','Selección') NOT NULL,
  `estado` enum('Pendiente','Procesado','Conservado','Eliminado') DEFAULT 'Pendiente',
  `fecha_notificacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_procesado` timestamp NULL DEFAULT NULL,
  `id_usuario_proceso` int DEFAULT NULL,
  `observaciones` text,
  PRIMARY KEY (`id`),
  KEY `id_expediente` (`id_expediente`),
  KEY `id_usuario_proceso` (`id_usuario_proceso`),
  CONSTRAINT `retencion_notificaciones_ibfk_1` FOREIGN KEY (`id_expediente`) REFERENCES `expedientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `retencion_notificaciones_ibfk_2` FOREIGN KEY (`id_usuario_proceso`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `retencion_notificaciones`
--

LOCK TABLES `retencion_notificaciones` WRITE;
/*!40000 ALTER TABLE `retencion_notificaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `retencion_notificaciones` ENABLE KEYS */;
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
INSERT INTO `rol_permisos` VALUES (1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(2,6),(1,7),(1,8),(2,8),(1,9),(2,9),(1,10),(2,10),(1,11),(1,12),(1,13),(1,101),(1,102),(1,103),(1,104),(1,105),(1,106),(1,107),(1,108),(1,109),(1,201),(1,202),(1,203),(1,204),(1,205),(1,206),(1,207),(1,208),(1,209),(1,210),(1,211),(1,212),(1,213),(1,214),(1,215),(1,301),(1,302),(1,303),(1,304),(1,305),(1,306),(1,307),(1,308),(1,309),(1,310),(1,311),(1,312),(1,313),(1,314),(1,327),(1,331),(1,335),(1,339),(1,343),(1,344),(1,345),(1,346),(1,347),(1,348),(1,353),(1,354),(1,355),(1,358),(1,359),(1,360),(1,361),(1,362),(1,363),(1,364),(1,365),(1,366),(1,367),(1,368),(1,369),(1,370),(1,371),(1,373),(1,374),(1,382),(1,383),(1,384),(1,385),(1,386),(1,387),(1,388),(1,389),(1,390),(1,391),(1,392),(1,393),(1,394),(1,396),(1,397),(1,399),(1,400),(1,402),(1,403);
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Administrador'),(2,'Prueba_usuario');
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
  `retencion_gestion` int DEFAULT NULL,
  `retencion_central` int DEFAULT NULL,
  `disposicion_final` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_oficina_productora` (`id_oficina_productora`,`codigo_serie`),
  CONSTRAINT `trd_series_ibfk_1` FOREIGN KEY (`id_oficina_productora`) REFERENCES `oficinas_productoras` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trd_series`
--

LOCK TABLES `trd_series` WRITE;
/*!40000 ALTER TABLE `trd_series` DISABLE KEYS */;
INSERT INTO `trd_series` VALUES (1,1,'1','Prueba_serie',1,1,NULL,NULL,NULL),(2,2,'01','Serie Ejemplo 1',1,1,NULL,NULL,NULL),(3,2,'02','Serie Ejemplo 2',1,0,5,10,NULL),(4,3,'01','Serie Ejemplo 3',1,1,NULL,NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trd_subseries`
--

LOCK TABLES `trd_subseries` WRITE;
/*!40000 ALTER TABLE `trd_subseries` DISABLE KEYS */;
INSERT INTO `trd_subseries` VALUES (1,1,'1','Prueba',1,2,'Eliminación','Se elimina en su totalidad',1),(2,4,'01','Subserie Ejemplo 1',5,10,'Conservación Total',NULL,1),(3,4,'02','Subserie Ejemplo 2',3,7,'Eliminación',NULL,1),(4,3,'01','Subserie Ejemplo 3',2,5,'Selección',NULL,1),(5,1,'5','Subserie Ejemplo 5',5,10,'Conservación Total',NULL,1),(6,1,'7','Subserie Ejemplo 7',3,7,'Eliminación',NULL,1),(7,1,'8','Subserie Ejemplo 8',2,5,'Selección',NULL,1);
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (5,'Usuario Administrador','sneider.fuquen@imevi.co','1010101010','$2b$10$3HoQG9ByI98NAjcFA2S5QuVBYDpYcy.Uld0raZ7D4n3oDVvIEOtDe',1,1,NULL,NULL),(8,'sneider fuquen','sneifubernal@gmail.com','1018465545','$2b$10$Xm7qlbouv/xps.31G7Ah9uMnDYvAJPbmD9qNtZTqxrKFCLEhiScFq',1,1,NULL,NULL);
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

-- Dump completed on 2025-12-20  8:13:50
