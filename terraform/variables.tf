variable "kubeconfig_path" {
  type        = string
  default     = "~/.kube/config"
  description = "Path to the kubeconfig file"
}

variable "namespace" {
  type        = string
  default     = "fairshare"
  description = "Kubernetes namespace for deployment"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment"
}

variable "client_url" {
  type        = string
  default     = "https://fairshare.local"
  description = "Public URL for the Next.js client"
}

variable "api_url" {
  type        = string
  default     = "https://fairshare.local/api"
  description = "Public URL for the backend API"
}

variable "database_url" {
  type        = string
  sensitive   = true
  description = "PostgreSQL pooled connection string"
}

variable "direct_url" {
  type        = string
  sensitive   = true
  description = "PostgreSQL direct connection string"
}

variable "supabase_url" {
  type        = string
  description = "Supabase API URL"
}

variable "supabase_anon_key" {
  type        = string
  sensitive   = true
  description = "Supabase anonymous publishable key"
}

variable "supabase_service_role_key" {
  type        = string
  sensitive   = true
  description = "Supabase service role secret key"
}

variable "jwt_secret" {
  type        = string
  sensitive   = true
  description = "JWT encryption secret"
}
