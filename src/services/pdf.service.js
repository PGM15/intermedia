import PDFDocument from "pdfkit";

export const generateDeliveryNotePdfBuffer = (deliveryNote) => {
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

    doc.text(`Usuario: ${deliveryNote.user?.name || ""} ${deliveryNote.user?.lastName || ""}`);
    doc.text(`Cliente: ${deliveryNote.client?.name || "-"}`);
    doc.text(`Proyecto: ${deliveryNote.project?.name || "-"}`);
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

    if (deliveryNote.signatureUrl) {
      doc.moveDown();
      doc.text(`Firma: ${deliveryNote.signatureUrl}`);
    }

    doc.end();
  });
};