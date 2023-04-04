CREATE DATABASE chatapp 
USE chatapp
CREATE TABLE `users` (
`id` int NOT NULL AUTO_INCREMENT,
`username` varchar(45) NOT NULL,
`password` longtext NOT NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `username_UNIQUE` (`username`)
);
CREATE TABLE `chat` (
`id` int NOT NULL AUTO_INCREMENT,
`user1_id` int NOT NULL,
`user2_id` int NOT NULL,
PRIMARY KEY (`id`),
KEY `user1_id_idx` (`user1_id`),
KEY `user2_id_fk_idx` (`user2_id`),
CONSTRAINT `user1_id_fk` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

  CREATE TABLE `message` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int DEFAULT NULL,
  `receiver_id` int DEFAULT NULL,
  `content` longtext NOT NULL,
  `chat_id` int DEFAULT NULL,
  `timeSt` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  KEY `chat_id_fk_idx` (`chat_id`),
  CONSTRAINT `chat_id_fk` FOREIGN KEY (`chat_id`) REFERENCES `chat` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);