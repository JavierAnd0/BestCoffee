import { NextResponse, type NextRequest } from "next/server";
import {
  COLOMBIA_DEPARTMENTS,
  getColombiaDepartments,
  getCitiesForDepartment,
  normalizeDepartmentName,
} from "@/lib/data/colombia";
import { getTenantSlug } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  const tenant = (await getTenantSlug()) || "default";
  const { searchParams } = new URL(request.url);
  const departmentParam = searchParams.get("department");

  // Si se solicita un departamento específico, devolvemos sus ciudades
  if (departmentParam) {
    const canonicalDept = normalizeDepartmentName(departmentParam) || departmentParam;
    const cities = getCitiesForDepartment(departmentParam);

    return NextResponse.json({
      tenant,
      department: canonicalDept,
      totalCities: cities.length,
      cities,
    });
  }

  // Devolver el listado completo de departamentos y sus ciudades asociadas
  return NextResponse.json({
    tenant,
    totalDepartments: COLOMBIA_DEPARTMENTS.length,
    departments: getColombiaDepartments(),
    data: COLOMBIA_DEPARTMENTS,
  });
}
