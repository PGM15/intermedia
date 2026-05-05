import PDFDocument from "pdfkit";

const formatAddress = (address = {}) =>
  [
    address.street,
    address.number,
    address.postal || address.postalCode,
    address.city,
    address.province,
    address.country,
  ]
    .filter(Boolean)
    .join(", ") || "-";

export const generateDeliveryNotePdfBuffer = (deliveryNote, options = {}) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Albarán", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`ID: ${deliveryNote._id}`);
    doc.text(`Formato: ${deliveryNote.format}`);
    doc.text(`Fecha de trabajo: ${new Date(deliveryNote.workDate).toLocaleDateString()}`);
    doc.text(`Descripción: ${deliveryNote.description || "-"}`);
    doc.moveDown();

    doc.fontSize(14).text("Usuario");
    doc.fontSize(12).text(`Nombre: ${deliveryNote.user?.name || ""} ${deliveryNote.user?.lastName || ""}`.trim());
    doc.text(`Email: ${deliveryNote.user?.email || "-"}`);
    doc.moveDown();

    doc.fontSize(14).text("Cliente");
    doc.fontSize(12).text(`Nombre: ${deliveryNote.client?.name || "-"}`);
    doc.text(`CIF/NIF: ${deliveryNote.client?.cif || "-"}`);
    doc.text(`Email: ${deliveryNote.client?.email || "-"}`);
    doc.text(`Teléfono: ${deliveryNote.client?.phone || "-"}`);
    doc.text(`Dirección: ${formatAddress(deliveryNote.client?.address)}`);
    doc.moveDown();

    doc.fontSize(14).text("Proyecto");
    doc.fontSize(12).text(`Nombre: ${deliveryNote.project?.name || "-"}`);
    doc.text(`Código: ${deliveryNote.project?.projectCode || "-"}`);
    doc.text(`Email: ${deliveryNote.project?.email || "-"}`);
    doc.text(`Dirección: ${formatAddress(deliveryNote.project?.address)}`);
    doc.text(`Notas: ${deliveryNote.project?.notes || "-"}`);
    doc.moveDown();

    if (deliveryNote.format === "material") {
      doc.text("Detalle de material:");
      doc.text(`Material: ${deliveryNote.material || "-"}`);
      doc.text(`Cantidad: ${deliveryNote.quantity ?? "-"}`);
      doc.text(`Unidad: ${deliveryNote.unit || "-"}`);
    }

    if (deliveryNote.format === "hours") {
      doc.text("Detalle de horas:");
      doc.text(`Horas totales: ${deliveryNote.hours ?? "-"}`);
      doc.moveDown();

      if (deliveryNote.workers?.length) {
        doc.text("Trabajadores:");
        deliveryNote.workers.forEach((worker, index) => {
          doc.text(`${index + 1}. ${worker.name} - ${worker.hours} horas`);
        });
      }
    }

    doc.moveDown();
    doc.text(`Firmado: ${deliveryNote.signed ? "Sí" : "No"}`);

    if (deliveryNote.signedAt) {
      doc.text(`Fecha de firma: ${new Date(deliveryNote.signedAt).toLocaleString()}`);
    }

    if (options.signatureBuffer) {
      doc.moveDown();
      doc.text("Firma:");
      doc.image(options.signatureBuffer, {
        fit: [220, 100],
        align: "left",
      });
    } else if (deliveryNote.signatureUrl) {
      doc.moveDown();
      doc.text(`Firma: ${deliveryNote.signatureUrl}`);
    }

    doc.end();
  });
};
