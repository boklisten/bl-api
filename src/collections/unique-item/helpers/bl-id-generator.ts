import { Canvas } from "canvas";
import JsBarcode from "jsbarcode";
import { PassThrough } from "stream";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const BL_ID_LENGTH = 12;
const VALID_BL_ID_CHARACTERS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const PRINTER_DIMENSIONS = {
  label: {
    height: 271,
    width: 696,
    margin: 0,
    spaceBetween: 20,
  },
  qrcode: {
    height: 250,
    width: 250,
    scale: 6,
    margin: 0,
    paddingTop: 40,
  },
  barcode: {
    height: 0,
    width: 0,
    fontSize: 40,
    barcodeWidth: 3,
    barcodeHeight: 210,
    margin: 5,
    marginBottom: 15,
  },
};

function generateBLIDs(numberOfIds: number): string[] {
  return Array.from({ length: numberOfIds }, () =>
    Array.from(
      { length: BL_ID_LENGTH },
      () =>
        VALID_BL_ID_CHARACTERS[
          Math.floor(Math.random() * VALID_BL_ID_CHARACTERS.length)
        ]
    ).join("")
  );
}

function createBarcodeCanvas(id: string): Canvas {
  const canvas = new Canvas(
    PRINTER_DIMENSIONS.barcode.width,
    PRINTER_DIMENSIONS.barcode.height
  );
  JsBarcode(canvas, id, {
    fontSize: PRINTER_DIMENSIONS.barcode.fontSize,
    width: PRINTER_DIMENSIONS.barcode.barcodeWidth,
    height: PRINTER_DIMENSIONS.barcode.barcodeHeight,
    margin: PRINTER_DIMENSIONS.barcode.margin,
    marginBottom: PRINTER_DIMENSIONS.barcode.marginBottom,
    text: "BL-" + id,
  });
  return canvas;
}

function createQRCodeCanvas(id: string): Canvas {
  const canvas = new Canvas(
    PRINTER_DIMENSIONS.qrcode.width,
    PRINTER_DIMENSIONS.qrcode.height
  );
  QRCode.toCanvas(
    canvas,
    id,
    {
      margin: PRINTER_DIMENSIONS.qrcode.margin,
      scale: PRINTER_DIMENSIONS.qrcode.scale,
      errorCorrectionLevel: "H",
    },
    (error) => {
      if (error) {
        throw error;
      }
    }
  );
  return canvas;
}

function createBlIdCanvas(id: string): Canvas {
  const barcodeCanvas = createBarcodeCanvas(id);
  const qrcodeCanvas = createQRCodeCanvas(id);
  const totalHeight = PRINTER_DIMENSIONS.label.height;
  const totalWidth = PRINTER_DIMENSIONS.label.width;

  const blIdCanvas = new Canvas(totalWidth, totalHeight);

  const printCtx = blIdCanvas.getContext("2d");
  printCtx.fillStyle = "white";
  printCtx.fillRect(0, 0, totalWidth, totalHeight);

  printCtx.drawImage(qrcodeCanvas, 0, PRINTER_DIMENSIONS.qrcode.paddingTop);
  printCtx.drawImage(
    barcodeCanvas,
    qrcodeCanvas.width + PRINTER_DIMENSIONS.label.spaceBetween,
    0
  );

  return blIdCanvas;
}

function addIdPagesToDoc(id: string, doc: PDFKit.PDFDocument): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const canvas: Canvas = createBlIdCanvas(id);
    const pngBuffers: Buffer[] = [];
    const stream = canvas.createPNGStream();

    stream.on("data", (chunk: Buffer) => pngBuffers.push(chunk));
    stream.on("end", () => {
      const pngBuffer = Buffer.concat(pngBuffers);

      for (let i = 0; i < 2; i++) {
        doc.addPage({
          size: [canvas.width, canvas.height],
        });

        doc.image(pngBuffer, 0, 0, { width: canvas.width });
      }

      resolve();
    });
    stream.on("error", reject);
  });
}

async function generateBlIdPDF(): Promise<Buffer> {
  const ids = generateBLIDs(400);

  const doc = new PDFDocument({ autoFirstPage: false });
  const buffers: Buffer[] = [];
  const pass = new PassThrough();

  doc.pipe(pass);

  const idPromises: Promise<void>[] = ids.map((id: string) =>
    addIdPagesToDoc(id, doc)
  );

  await Promise.all(idPromises);
  doc.end();

  // Collecting data from the PDFDocument through the PassThrough stream
  pass.on("data", (chunk: Buffer) => buffers.push(chunk));

  // Wait until the 'finish' event is emitted before resolving the main promise
  return new Promise<Buffer>((resolve, reject) => {
    pass.on("end", () => {
      resolve(Buffer.concat(buffers));
    });
    pass.on("error", reject);
  });
}

export default generateBlIdPDF;
