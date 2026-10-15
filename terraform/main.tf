terraform {
  required_version = ">= 1.5.0"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "kubernetes" {
  config_path = var.kubeconfig_path
}

# 1. Kubernetes Namespace Provisioning
resource "kubernetes_namespace" "fairshare" {
  metadata {
    name = var.namespace
    labels = {
      environment = var.environment
      managed_by  = "terraform"
    }
  }
}

# 2. ConfigMap Provisioning
resource "kubernetes_config_map" "fairshare_config" {
  metadata {
    name      = "fairshare-config"
    namespace = kubernetes_namespace.fairshare.metadata[0].name
  }

  data = {
    NODE_ENV            = "production"
    PORT                = "5000"
    CLIENT_PORT         = "3000"
    CLIENT_URL          = var.client_url
    NEXT_PUBLIC_API_URL = var.api_url
  }
}

# 3. Secure Secrets Provisioning
resource "kubernetes_secret" "fairshare_secrets" {
  metadata {
    name      = "fairshare-secrets"
    namespace = kubernetes_namespace.fairshare.metadata[0].name
  }

  type = "Opaque"

  data = {
    DATABASE_URL              = var.database_url
    DIRECT_URL                = var.direct_url
    SUPABASE_URL              = var.supabase_url
    SUPABASE_ANON_KEY         = var.supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY = var.supabase_service_role_key
    JWT_SECRET                = var.jwt_secret
  }
}
