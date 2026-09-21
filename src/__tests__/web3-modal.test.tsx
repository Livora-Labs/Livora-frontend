import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Web3ConfirmModal } from "@/components/Web3ConfirmModal";

describe("Web3ConfirmModal Unit Tests", () => {
  it("no renderiza nada cuando isOpen es false", () => {
    const { container } = render(
      <Web3ConfirmModal
        isOpen={false}
        tokenAmount="25.00"
        destinationName="Tienda Orgánica"
        destinationAddress="GABC1234567890"
        actionDescription="Canje de LIVOs"
        concept="Compra de prueba"
        warningText="Al confirmar, autorizas a Livora a firmar la transacción en la blockchain Stellar. Esta acción es irreversible."
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renderiza correctamente los detalles del canje y la advertencia de irreversibilidad on-chain", () => {
    render(
      <Web3ConfirmModal
        isOpen={true}
        tokenAmount="25.00"
        destinationName="Tienda Orgánica"
        destinationAddress="GABC1234567890"
        actionDescription="Canje de LIVOs"
        concept="Compra de prueba"
        warningText="Al confirmar, autorizas a Livora a firmar la transacción en la blockchain Stellar. Esta acción es irreversible."
        isLoading={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(/25.00/)).toBeInTheDocument();
    expect(screen.getByText("Tienda Orgánica")).toBeInTheDocument();
    expect(screen.getByText(/Al confirmar, autorizas a Livora a firmar la transacción en la blockchain Stellar/i)).toBeInTheDocument();
  });

  it("ejecuta los callbacks onConfirm y onCancel al interactuar con los botones", () => {
    const onConfirmMock = vi.fn();
    const onCancelMock = vi.fn();

    render(
      <Web3ConfirmModal
        isOpen={true}
        tokenAmount="50.00"
        destinationName="Bodega Verde"
        destinationAddress="GXYZ9876543210"
        actionDescription="Canje"
        concept="Canje Verde"
        warningText="Acción irreversible"
        isLoading={false}
        onConfirm={onConfirmMock}
        onCancel={onCancelMock}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: /Cancelar/i });
    fireEvent.click(cancelBtn);
    expect(onCancelMock).toHaveBeenCalledTimes(1);

    const confirmBtn = screen.getByRole("button", { name: /Confirmar y Delegar/i });
    fireEvent.click(confirmBtn);
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });
});
