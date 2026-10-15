output "namespace_name" {
  value       = kubernetes_namespace.fairshare.metadata[0].name
  description = "The provisioned Kubernetes namespace"
}

output "config_map_name" {
  value       = kubernetes_config_map.fairshare_config.metadata[0].name
  description = "The provisioned ConfigMap name"
}

output "secrets_name" {
  value       = kubernetes_secret.fairshare_secrets.metadata[0].name
  description = "The provisioned Secrets name"
}
