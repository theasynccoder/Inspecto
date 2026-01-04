-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: fssai
-- ------------------------------------------------------
-- Server version	8.0.40

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
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `zone` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (1,'Meera Joshi','admin@gmail.com','9876543210','pass123','Banglore South','2025-06-11 20:12:02'),(2,'Ravi Kumar','admin2@gmail.com','9123456780','pass123','Banglore Central','2025-06-11 20:12:02'),(3,'Sneha Shah','admin3@gmail.com','9012345678','pass123','Chennai North','2025-06-11 20:12:02');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaints`
--

DROP TABLE IF EXISTS `complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) NOT NULL,
  `restaurant_id` int NOT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_anonymous` tinyint(1) DEFAULT '0',
  `status` enum('pending','in-progress','resolved','rejected') DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `restaurant_id` (`restaurant_id`),
  CONSTRAINT `complaints_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`email`) ON DELETE CASCADE,
  CONSTRAINT `complaints_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaints`
--

LOCK TABLES `complaints` WRITE;
/*!40000 ALTER TABLE `complaints` DISABLE KEYS */;
INSERT INTO `complaints` VALUES (1,'hello@gmail.com',2,'kdsjivbhufhewi','dsmlvj h ndhbvJOI ',0,'pending','2025-07-06 15:06:02',NULL);
/*!40000 ALTER TABLE `complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `user_id` varchar(255) NOT NULL,
  `restaurant_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`restaurant_id`),
  KEY `restaurant_id` (`restaurant_id`),
  CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`email`),
  CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorites`
--

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
INSERT INTO `favorites` VALUES ('hello@gmail.com',1),('hello@gmail.com',3);
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inspection_reports`
--

DROP TABLE IF EXISTS `inspection_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inspection_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `inspection_id` int DEFAULT NULL,
  `inspector_id` int DEFAULT NULL,
  `restaurant_id` int DEFAULT NULL,
  `report_json` json DEFAULT NULL,
  `notes` text,
  `image_paths` json DEFAULT NULL,
  `latitude` decimal(9,6) DEFAULT NULL,
  `longitude` decimal(9,6) DEFAULT NULL,
  `hygiene_score` decimal(2,1) DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `inspection_id` (`inspection_id`),
  KEY `inspector_id` (`inspector_id`),
  KEY `restaurant_id` (`restaurant_id`),
  CONSTRAINT `inspection_reports_ibfk_1` FOREIGN KEY (`inspection_id`) REFERENCES `inspections` (`id`),
  CONSTRAINT `inspection_reports_ibfk_2` FOREIGN KEY (`inspector_id`) REFERENCES `inspectors` (`id`),
  CONSTRAINT `inspection_reports_ibfk_3` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`),
  CONSTRAINT `inspection_reports_chk_1` CHECK ((`hygiene_score` between 1.0 and 5.0))
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inspection_reports`
--

LOCK TABLES `inspection_reports` WRITE;
/*!40000 ALTER TABLE `inspection_reports` DISABLE KEYS */;
INSERT INTO `inspection_reports` VALUES (17,38,NULL,1,'{\"equipment\": {\"cleanUtensils\": \"on\", \"properSanitization\": \"on\"}, \"foodStorage\": {\"noExpiredItems\": \"on\", \"properLabeling\": \"on\"}, \"personalHygiene\": {\"handsClean\": \"on\"}, \"premisesCleanliness\": {\"floorsClean\": \"on\"}}','bye','[\"1751660703080-RVCE logo.png\"]',NULL,NULL,3.5,'2025-07-04 20:25:03','pending',NULL),(18,36,1,1,'{\"equipment\": {\"maintenanceUpToDate\": \"on\", \"workingRefrigeration\": \"on\"}, \"personalHygiene\": {\"handsClean\": \"on\"}, \"premisesCleanliness\": {\"ceilingsClean\": \"on\"}}','good','[\"1751661782804-photo.jpg\", \"1751661783172-photo1.jpg\"]',12.924261,77.501563,4.5,'2025-07-04 20:43:03','pending',NULL),(21,36,1,10,'{\"personalHygiene\": {\"uniformClean\": \"on\"}}','hello','[\"1751661782804-photo.jpg\", \"1751661783172-photo1.jpg\"]',12.969574,77.614285,3.6,'2025-07-04 20:59:45','pending',NULL),(23,39,1,10,'{\"equipment\": {\"maintenanceUpToDate\": \"on\"}, \"foodStorage\": {\"separateRawCooked\": \"on\"}, \"personalHygiene\": {\"handsClean\": \"on\"}, \"premisesCleanliness\": {\"floorsClean\": \"on\", \"tablesClean\": \"on\"}}','notes','[\"1751721174385-Sign.jpg\"]',12.924265,77.501562,4.0,'2025-07-05 13:12:54','approved',NULL),(24,37,1,7,'{\"equipment\": {\"cleanUtensils\": \"on\", \"properSanitization\": \"on\"}, \"foodStorage\": {\"properLabeling\": \"on\", \"temperatureControlled\": \"on\"}, \"personalHygiene\": {\"handsClean\": \"on\", \"hairCovered\": \"on\"}, \"wasteManagement\": {\"pestControl\": \"on\", \"properDisposal\": \"on\", \"regularCollection\": \"on\"}, \"premisesCleanliness\": {\"ceilingsClean\": \"on\"}}','yes','[\"1751724419837-Screenshot 2025-05-04 184805.png\"]',12.976128,77.581517,2.5,'2025-07-05 14:07:00','rejected',NULL),(25,43,1,7,'{\"equipment\": {\"workingRefrigeration\": \"on\"}, \"foodStorage\": {\"noExpiredItems\": \"on\"}, \"personalHygiene\": {\"handsClean\": \"on\", \"hairCovered\": \"on\"}, \"wasteManagement\": {\"coveredBins\": \"on\"}, \"premisesCleanliness\": {\"wallsClean\": \"on\", \"tablesClean\": \"on\"}}','paras','[\"1751745895241-Screenshot 2024-02-03 202205.png\"]',12.976128,77.581517,1.8,'2025-07-05 20:04:55','approved',NULL),(26,40,1,7,'{\"equipment\": {\"properSanitization\": \"on\", \"maintenanceUpToDate\": \"on\", \"workingRefrigeration\": \"on\"}, \"foodStorage\": {\"temperatureControlled\": \"on\"}, \"personalHygiene\": {\"handsClean\": \"on\"}, \"wasteManagement\": {\"regularCollection\": \"on\"}, \"premisesCleanliness\": {\"wallsClean\": \"on\", \"floorsClean\": \"on\", \"tablesClean\": \"on\", \"ceilingsClean\": \"on\"}}','hello','[\"https://res.cloudinary.com/dpmwiahun/image/upload/v1751891511/fssai-inspections/oo4cw42ogl40nmpd6lom.png\"]',12.959744,77.601178,2.5,'2025-07-07 12:31:52','approved',1),(27,44,1,7,'{\"equipment\": {\"cleanUtensils\": \"on\", \"properSanitization\": \"on\"}, \"foodStorage\": {\"properLabeling\": \"on\", \"separateRawCooked\": \"on\", \"temperatureControlled\": \"on\"}, \"wasteManagement\": {\"properDisposal\": \"on\"}, \"premisesCleanliness\": {\"wallsClean\": \"on\"}}','dfsdgfhgh,j.k','[\"https://res.cloudinary.com/dpmwiahun/image/upload/v1751913414/fssai-inspections/vbmlnu426pz5scneydiz.png\"]',12.959744,77.601178,1.8,'2025-07-07 18:36:56','pending',NULL),(28,46,1,7,'{\"equipment\": {\"properSanitization\": \"on\"}, \"foodStorage\": {\"separateRawCooked\": \"on\"}, \"personalHygiene\": {\"handsClean\": \"on\"}, \"wasteManagement\": {\"regularCollection\": \"on\"}, \"premisesCleanliness\": {\"ceilingsClean\": \"on\"}}','sehyudvbaioS','[\"https://res.cloudinary.com/dpmwiahun/image/upload/v1753677939/fssai-inspections/xw35vhx8z7wvfy476yby.png\"]',12.924588,77.499271,1.3,'2025-07-28 04:45:40','approved',1),(29,47,1,7,'{\"equipment\": {\"maintenanceUpToDate\": \"on\"}, \"personalHygiene\": {\"handsClean\": \"on\"}, \"wasteManagement\": {\"pestControl\": \"on\"}, \"premisesCleanliness\": {\"wallsClean\": \"on\"}}','good','[\"https://res.cloudinary.com/dpmwiahun/image/upload/v1753682262/fssai-inspections/r0ps31c1ukedldm8ngrb.jpg\"]',12.959744,77.640499,1.0,'2025-07-28 05:57:44','approved',1);
/*!40000 ALTER TABLE `inspection_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inspections`
--

DROP TABLE IF EXISTS `inspections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inspections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `restaurant_id` int NOT NULL,
  `inspector_id` int NOT NULL,
  `status` enum('Scheduled','Not-Scheduled','Completed') NOT NULL DEFAULT 'Not-Scheduled',
  `last_inspection` date DEFAULT NULL,
  `inspection_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `restaurant_id` (`restaurant_id`),
  KEY `inspector_id` (`inspector_id`),
  CONSTRAINT `inspections_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`),
  CONSTRAINT `inspections_ibfk_2` FOREIGN KEY (`inspector_id`) REFERENCES `inspectors` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inspections`
--

LOCK TABLES `inspections` WRITE;
/*!40000 ALTER TABLE `inspections` DISABLE KEYS */;
INSERT INTO `inspections` VALUES (16,1,1,'Completed','2025-06-10','2025-06-12'),(17,2,1,'Completed','2025-06-05',NULL),(18,3,1,'Completed','2025-05-30','2025-06-14'),(19,4,1,'Not-Scheduled','2025-05-20','2025-06-11'),(27,9,1,'Not-Scheduled','2025-06-09','2025-07-01'),(36,10,1,'Completed','2025-07-05','2025-07-28'),(37,7,1,'Completed','2025-07-05','2025-07-04'),(38,7,1,'Completed',NULL,'2025-07-05'),(39,10,1,'Completed','2025-07-05','2025-07-05'),(40,7,1,'Completed','2025-07-07','2025-07-17'),(43,7,1,'Completed','2025-07-06','2025-07-23'),(44,7,1,'Completed','2025-07-08','2025-07-08'),(46,7,1,'Completed','2025-07-28','2025-07-28'),(47,7,1,'Completed','2025-07-28','2025-07-28'),(48,12,1,'Scheduled',NULL,'2025-07-31'),(49,7,1,'Scheduled',NULL,'2025-08-09');
/*!40000 ALTER TABLE `inspections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inspectors`
--

DROP TABLE IF EXISTS `inspectors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inspectors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `zone` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inspectors`
--

LOCK TABLES `inspectors` WRITE;
/*!40000 ALTER TABLE `inspectors` DISABLE KEYS */;
INSERT INTO `inspectors` VALUES (1,'Karthik Rao','insp@gmail.com','7890123455','pass123','Banglore South','Kengeri','2025-06-11 20:12:02'),(2,'Anjali Menon','insp2@gmail.com','7890654321','pass123','Banglore South','Pattanagere','2025-06-11 20:12:02'),(3,'Vikram Singh','insp3@gmail.com','8989898980','pass123','Banglore South','Nayandahalli','2025-06-11 20:12:02'),(4,'Neha Verma','insp4@gmail.com','9090909090','pass123','Banglore Central','Indiranagar','2025-06-11 20:12:02'),(5,'Sameer Patil','insp5@gmail.com','8787878787','pass123','Banglore Central','Koramangala','2025-06-11 20:12:02'),(6,'Pooja Reddy','insp6@gmail.com','8980077000','pass123','Chennai North','Red Hills','2025-06-11 20:12:02'),(7,'Aman Bhatt','insp7@gmail.com','8567452301','pass123','Chennai North','Minjur','2025-06-11 20:12:02'),(16,'Hemanth','insp8@gmail.com','9876543210','pass123','Banglore South','Kengeri','2025-07-08 03:36:18');
/*!40000 ALTER TABLE `inspectors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `restaurants`
--

DROP TABLE IF EXISTS `restaurants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `restaurants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `license_number` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `zone` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `address` text,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_inspection_date` date DEFAULT NULL,
  `hygiene_score` decimal(2,1) DEFAULT NULL,
  `insp_rep_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `restaurants_chk_1` CHECK ((`hygiene_score` between 1.0 and 5.0))
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `restaurants`
--

LOCK TABLES `restaurants` WRITE;
/*!40000 ALTER TABLE `restaurants` DISABLE KEYS */;
INSERT INTO `restaurants` VALUES (1,'Spice Hub','meraj','LIC12345','spicehub@gmail.com','9876543212','Bangalore South','Kengeri','12, Kengeri Main Rd','approved',1,'2025-06-12 14:35:37',NULL,4.0,NULL),(2,'Green Leaf','hello','LIC67890','greenleaf@gmail.com','9123456789','Bangalore South','Pattanagere','78, JP Nagar','approved',1,'2025-06-12 14:35:37',NULL,3.5,NULL),(3,'Tandoori Treat','bye','LIC11122','treat@gmail.com','9988776655','Bangalore Central','Indiranagar','45, CMH Road','approved',5,'2025-06-12 14:35:37',NULL,1.0,NULL),(4,'Chennai Flavours','tata','LIC33344','cf@gmail.com','9080706050','Chennai North','Red Hills','56, Red Hills Rd','approved',6,'2025-06-12 14:35:37',NULL,2.2,NULL),(7,'Spice Hub111','shkfdajv','LIC12347','spicehub@gmail.com','9876543211','Banglore South','Kengeri','12, Kengeri Main Rd','approved',1,'2025-06-12 14:35:37','2025-07-28',1.0,29),(8,'Spice Hub112','rizwan','LIC12348','spicehub@gmail.com','9876543210','Banglore South','Pattanagere','12, Kengeri Main Rd','pending',1,'2025-06-12 14:35:37',NULL,2.5,NULL),(9,'Spice Hub113','polish','LIC12346','spicehub@gmail.com','9876543210','Banglore South','Kengeri','12, Kengeri Main Rd','rejected',1,'2025-06-12 14:35:37',NULL,3.0,NULL),(10,'Spice Hub114','hi','LIC12347','spicehub@gmail.com','9876543210','Banglore South','Pattanagere','12, Kengeri Main Rd','approved',2,'2025-06-12 14:35:37','2025-07-05',NULL,NULL),(11,'svdb','ksfjdh','LIC65123','spicehub@gmail.com','9876543210','Banglore South','Kengeri','kengeri main road','rejected',1,'2025-07-04 18:06:38',NULL,4.0,NULL),(12,'fabawtr','hjmhg ','LIC000001','inspector@fssai.gov.in','9876543210','Banglore South','Kengeri','pattangere main road','approved',1,'2025-07-04 18:35:10',NULL,NULL,NULL),(13,'hello','lksvdjhb','LIC3215615','kjcjbkej@gmail.com','9876543210','Banglore South','Kengeri','amklsncjadvh','pending',1,'2025-07-07 20:18:17',NULL,NULL,NULL),(14,'lmwekfnbh','lksdnaj','LIC0000001','skfjdbvha@gmail.com','9876543210','Banglore South','Kengeri','alksvhd','pending',1,'2025-07-07 20:19:26',NULL,NULL,NULL),(15,'dsfgnmh','lmksjdvbh','LIC3215616','uskfj@gmail.com','9876543210','Banglore South','Kengeri','slkncjvdh','approved',1,'2025-07-07 20:29:03',NULL,NULL,NULL);
/*!40000 ALTER TABLE `restaurants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('hello','hello@gmail.com','9876543210','pass123');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-30 19:17:46