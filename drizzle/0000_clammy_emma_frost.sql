CREATE TABLE `admin_records` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`record_type` text NOT NULL,
	`title` text NOT NULL,
	`details` text NOT NULL,
	`amount` real,
	`status` text NOT NULL,
	`record_date` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` text NOT NULL,
	`username` text NOT NULL,
	`user_group` text NOT NULL,
	`action` text NOT NULL,
	`resource` text NOT NULL,
	`access_granted` integer NOT NULL,
	`risk_level` text NOT NULL,
	`location` text NOT NULL,
	`ip_address` text NOT NULL,
	`policy_triggered` text NOT NULL,
	`failure_reason` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lab_result_values` (
	`id` text PRIMARY KEY NOT NULL,
	`lab_result_id` text NOT NULL,
	`panel_name` text NOT NULL,
	`test_name` text NOT NULL,
	`result_value` text NOT NULL,
	`reference_range` text NOT NULL,
	`flag` text NOT NULL,
	FOREIGN KEY (`lab_result_id`) REFERENCES `lab_results`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lab_results` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`ordering_physician` text NOT NULL,
	`date_ordered` text NOT NULL,
	`date_collected` text NOT NULL,
	`date_reported` text NOT NULL,
	`lab_facility` text NOT NULL,
	`lab_address` text NOT NULL,
	`specimen_type` text NOT NULL,
	`collection_method` text NOT NULL,
	`collection_time` text NOT NULL,
	`processed_by` text NOT NULL,
	`verified_by` text NOT NULL,
	`signature` text NOT NULL,
	`report_date` text NOT NULL,
	`comments` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `patient_allergies` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`allergen` text NOT NULL,
	`reaction` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `patient_history` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`condition` text NOT NULL,
	`details` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `patient_immunizations` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`vaccine` text NOT NULL,
	`date_administered` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `patient_vitals` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`recorded_date` text NOT NULL,
	`height` text NOT NULL,
	`weight` text NOT NULL,
	`bmi` real NOT NULL,
	`blood_pressure` text NOT NULL,
	`heart_rate` integer NOT NULL,
	`temperature` text NOT NULL,
	`oxygen_saturation` integer NOT NULL,
	`respiratory_rate` integer NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`dob` text NOT NULL,
	`age` integer NOT NULL,
	`gender` text NOT NULL,
	`blood_type` text NOT NULL,
	`nationality` text NOT NULL,
	`marital_status` text NOT NULL,
	`address` text NOT NULL,
	`phone_home` text NOT NULL,
	`phone_mobile` text NOT NULL,
	`email` text NOT NULL,
	`emergency_contact_name` text NOT NULL,
	`emergency_contact_relationship` text NOT NULL,
	`emergency_contact_phone` text NOT NULL,
	`insurance_provider` text NOT NULL,
	`policy_number` text NOT NULL,
	`group_number` text NOT NULL,
	`coverage_type` text NOT NULL,
	`primary_care_physician` text NOT NULL,
	`clinic_name` text NOT NULL,
	`clinic_phone` text NOT NULL,
	`last_visit_date` text NOT NULL,
	`next_visit_date` text NOT NULL,
	`clinical_notes` text NOT NULL,
	`department` text DEFAULT 'Cardiology' NOT NULL,
	`assigned_clinician_id` text DEFAULT 'doctor01' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `prescription_items` (
	`id` text PRIMARY KEY NOT NULL,
	`prescription_id` text NOT NULL,
	`medication` text NOT NULL,
	`strength` text NOT NULL,
	`dosage_form` text NOT NULL,
	`dose` text NOT NULL,
	`frequency` text NOT NULL,
	`route` text NOT NULL,
	`quantity` text NOT NULL,
	`refills` text NOT NULL,
	`indication` text NOT NULL,
	`special_instructions` text NOT NULL,
	FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`date_issued` text NOT NULL,
	`valid_until` text NOT NULL,
	`issuing_physician` text NOT NULL,
	`npi_number` text NOT NULL,
	`clinic_name` text NOT NULL,
	`clinic_address` text NOT NULL,
	`clinic_phone` text NOT NULL,
	`clinic_fax` text NOT NULL,
	`dispensed_by` text NOT NULL,
	`pharmacist` text NOT NULL,
	`pharmacy_address` text NOT NULL,
	`pharmacy_phone` text NOT NULL,
	`dispense_date` text NOT NULL,
	`patient_acknowledged` integer NOT NULL,
	`physician_signature` text NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `role_activations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role_name` text NOT NULL,
	`justification` text NOT NULL,
	`activated_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `security_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `security_groups_name_unique` ON `security_groups` (`name`);--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_groups` (
	`user_id` text NOT NULL,
	`group_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `group_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`group_id`) REFERENCES `security_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text DEFAULT 'Password2026!' NOT NULL,
	`display_name` text NOT NULL,
	`description` text NOT NULL,
	`project_meaning` text NOT NULL,
	`avatar_url` text DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=User' NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);