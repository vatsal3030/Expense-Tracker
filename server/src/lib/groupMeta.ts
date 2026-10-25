export function parseGroupMeta(description?: string | null) {
  if (!description) {
    return {
      description: '',
      isPasswordProtected: false,
      password: null as string | null,
      requireAdminApproval: false,
      onlyAdminInvite: false,
      onlyAdminEdit: false,
      simplifyDebts: true,
      requireSettlementConfirmation: false,
    };
  }
  const match = description.match(/<!--fs_meta:(.*?)-->/);
  if (!match) {
    return {
      description,
      isPasswordProtected: false,
      password: null as string | null,
      requireAdminApproval: false,
      onlyAdminInvite: false,
      onlyAdminEdit: false,
      simplifyDebts: true,
      requireSettlementConfirmation: false,
    };
  }
  try {
    const meta = JSON.parse(match[1]);
    const clean = description.replace(/\s*<!--fs_meta:.*?-->\s*/g, '').trim();
    return {
      description: clean,
      isPasswordProtected: Boolean(meta.pwd),
      password: (meta.pwd as string) || null,
      requireAdminApproval: Boolean(meta.approval),
      onlyAdminInvite: Boolean(meta.onlyAdminInvite),
      onlyAdminEdit: Boolean(meta.onlyAdminEdit),
      simplifyDebts: meta.simplifyDebts !== false,
      requireSettlementConfirmation: Boolean(meta.requireSettlementConfirmation),
    };
  } catch {
    return {
      description,
      isPasswordProtected: false,
      password: null as string | null,
      requireAdminApproval: false,
      onlyAdminInvite: false,
      onlyAdminEdit: false,
      simplifyDebts: true,
      requireSettlementConfirmation: false,
    };
  }
}
