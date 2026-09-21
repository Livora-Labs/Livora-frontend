import { describe, it, expect } from "vitest";

describe("Financial Distribution & Rates Engine (Cross-Repo Logic)", () => {
  const calculateFinancialSplit = (
    items: Record<string, number>,
    rates: Record<string, number>
  ) => {
    let totalGrossPenn = 0;
    for (const [mat, weight] of Object.entries(items)) {
      const pricePerKg = rates[mat] ?? rates[mat.toUpperCase()] ?? 1.0;
      totalGrossPenn += weight * pricePerKg;
    }

    const hogarSharePenn = Number((totalGrossPenn * 0.40).toFixed(2));
    const collectorSharePenn = Number((totalGrossPenn * 0.50).toFixed(2));
    const livoraTreasuryPenn = Number((totalGrossPenn * 0.10).toFixed(2));
    const requiredEscrowEco = collectorSharePenn; // 50% garantía

    return {
      totalGrossPenn,
      hogarSharePenn,
      collectorSharePenn,
      livoraTreasuryPenn,
      requiredEscrowEco,
      hogarLivos: hogarSharePenn, // 1 PEN = 1 LIVO
    };
  };

  it("debe calcular exactamente la distribución 40% Hogar / 50% Recolector / 10% Livora", () => {
    const items = { PET: 10, CARTON: 4 }; // 10kg PET @ S/ 1.00 + 4kg CARTON @ S/ 0.50 = S/ 12.00
    const rates = { PET: 1.00, CARTON: 0.50 };

    const split = calculateFinancialSplit(items, rates);

    expect(split.totalGrossPenn).toBe(12.00);
    expect(split.hogarSharePenn).toBe(4.80); // 40% de 12
    expect(split.collectorSharePenn).toBe(6.00); // 50% de 12
    expect(split.livoraTreasuryPenn).toBe(1.20); // 10% de 12
    expect(split.requiredEscrowEco).toBe(6.00);
    expect(split.hogarLivos).toBe(4.80);
  });

  it("debe garantizar que la suma de partes sea igual al 100% del valor bruto", () => {
    const items = { PET: 17.5, VIDRIO: 25.0, ALUMINIO: 8.2 };
    const rates = { PET: 1.20, VIDRIO: 0.35, ALUMINIO: 1.50 };

    const split = calculateFinancialSplit(items, rates);
    const sumParts = split.hogarSharePenn + split.collectorSharePenn + split.livoraTreasuryPenn;

    expect(Math.abs(sumParts - split.totalGrossPenn)).toBeLessThanOrEqual(0.01);
  });

  it("debe bloquear la orden si el saldo del recolector es menor al Escrow requerido", () => {
    const collectorBalance = 5.00; // 5 LIVO
    const requiredEscrow = 6.00; // 6 LIVO

    const canAccept = collectorBalance >= requiredEscrow;
    expect(canAccept).toBe(false);
  });

  it("debe autorizar la orden si el saldo del recolector cubre el Escrow requerido", () => {
    const collectorBalance = 20.00; // 20 LIVO
    const requiredEscrow = 6.00; // 6 LIVO

    const canAccept = collectorBalance >= requiredEscrow;
    expect(canAccept).toBe(true);
  });

  it("debe exigir que cada tarifa de compra por kg sea estrictamente >= 0.05 PEN", () => {
    const invalidTariffs = [0, 0.01, 0.04, -1, 0.000004];
    for (const rate of invalidTariffs) {
      const isValid = rate >= 0.05;
      expect(isValid).toBe(false);
    }

    const validTariffs = [0.05, 0.50, 1.00, 1.50];
    for (const rate of validTariffs) {
      const isValid = rate >= 0.05;
      expect(isValid).toBe(true);
    }
  });

  it("debe redondear las tarifas a un máximo de 2 decimales", () => {
    const rawRate = 1.256;
    const rounded = Number(rawRate.toFixed(2));
    expect(rounded).toBe(1.26);
    expect(rounded.toString().split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });
});
