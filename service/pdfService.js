import PDFDocument from "pdfkit";

export default class PDFService {
  static generatePDF(newOrderInfo) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      doc.fontSize(20).text("Potvrda Porudžbine", { align: "center" });
      doc.moveDown();

      if (newOrderInfo["Broj Porudžbine"]) {
        doc
          .fontSize(12)
          .text(`Broj Porudžbine: ${newOrderInfo["Broj Porudžbine"]}`);
        doc.moveDown();
      }

      doc.moveDown();

      if (newOrderInfo.Datum) {
        doc.fontSize(12).text(`Datum: ${newOrderInfo.Datum}`);
        doc.moveDown();
      }

      doc.moveDown();

      if (
        Array.isArray(newOrderInfo.Artikli) &&
        newOrderInfo.Artikli.length > 0
      ) {
        doc.fontSize(14).text("Artikli:", { underline: true });
        doc.moveDown();

        newOrderInfo.Artikli.forEach((item) => {
          doc
            .fontSize(12)
            .text(
              `${item.Naziv} | Velicina: ${item.Velicina} | Boja: ${item.Boja} | Cena: ${item.Cena} RSD`
            );
          doc.moveDown(0.5);
        });
      }

      doc.moveDown();

      if (newOrderInfo.Poštarina !== undefined) {
        doc.text(`Poštarina: ${newOrderInfo.Poštarina}`);
      }

      if (newOrderInfo.Kupon !== undefined) {
        doc.text(`Kupon: ${newOrderInfo.Kupon}`);
      }

      doc.moveDown();

      if (newOrderInfo.Cena) {
        doc.fontSize(16).text(newOrderInfo.Cena, { align: "right" });
      }

      doc.moveDown(2);

      doc
        .fontSize(10)
        .fillColor("gray")
        .text(
          "Sve detaljne informacije o vašoj porudžbini dostupne su u vašem korisnickom profilu. " +
            "Ako još niste registrovani, molimo vas da kreirate nalog u našoj aplikaciji kako biste mogli " +
            "da porucujete, koristite kupone i pratite status svojih narudžbina.",
          { align: "center", characterSpacing: 0.5 }
        );

      doc.end();
    });
  }
}
