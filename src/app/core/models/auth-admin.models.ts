export interface AuthUserSummary {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  status: number;
  roleIds?: string[];
  roleNames?: string[];
  roles?: string[];
  roleName?: string;
}

export interface AuthRoleSummary {
  id: string;
  name: string;
  description: string;
  status: number;
}

export interface AuthModuleSummary {
  id: string;
  name: string;
  description: string;
  status: number;
}

export interface RoleModuleAssignment {
  roleId: string;
  moduleIds: string[];
}

export interface RoleModulesDto {
  roleId: string;
  roleName: string;
  moduleIds: string[];
}

export interface UserRoleAssignment {
  userId: string;
  roleId: string;
}

export interface ModuleLicenseDTO {
  id?: string;
  tenantId: string;
  moduleId: string;
  enabled: boolean;
  expiresAt?: string | null;
}

export interface PermissionMatrixCell {
  roleId: string;
  moduleId: string;
  enabled: boolean;
}
