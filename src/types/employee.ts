export type EmployeeRole = "owner" | "partner" | "staff";

export type EmployeeStatus = "active" | "inactive";

export type Employee = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: EmployeeRole;
  status: EmployeeStatus;
};

export type EmployeeFormData = Omit<Employee, "id">;

export const employeeRoleLabels: Record<EmployeeRole, string> = {
  owner: "Dono",
  partner: "Socio",
  staff: "Funcionario",
};

export const employeeStatusLabels: Record<EmployeeStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
};
