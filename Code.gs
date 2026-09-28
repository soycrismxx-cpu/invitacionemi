// RSVP de Emily. Pegar en Extensiones > Apps Script del Google Sheet.
// Comienza por "// RSVP de Emily" y termina en "function json_(...)".
// Si ves mas lineas, hay texto duplicado: borra todo con Ctrl+A y pega una sola vez.
const CONFIG = {
  SPREADSHEET_ID: '1BzL5vvcnFoi2HeIx1HEWH2A82vaM49j9fKpjGzjZRV8',
  SHEET_NAME: 'Confirmaciones'
};
const HEADERS = ['Timestamp', 'Nombre', 'Asistirá', 'ID de envío'];

function setup() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  ss.setSpreadsheetTimeZone('America/Mexico_City');
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
  // Reencabezamos si la hoja esta vacia o si le sobran columnas de una version anterior.
  const actual = sheet.getLastRow() === 0 ? [] : sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0].filter(v => v !== '');
  if (actual.length !== HEADERS.length || actual.some((v, i) => String(v) !== HEADERS[i])) {
    if (sheet.getLastColumn() > HEADERS.length) sheet.getRange(1, HEADERS.length + 1, 1, sheet.getLastColumn() - HEADERS.length).clearContent();
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#d0b3e8');
    sheet.setFrozenRows(1);
    sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.autoResizeColumns(1, HEADERS.length);
  }
  return sheet;
}

function doGet() {
  return json_({ ok: true, service: 'RSVP Emily', message: 'Envía una solicitud POST para registrar tu respuesta.' });
}

function doPost(e) {
  let lock;
  try {
    const p = e && e.parameter || {};
    const name = String(p.name || '').trim();
    const attendance = p.attendance;
    const id = String(p.requestId || '');
    if (p.website) return json_({ ok: false, error: 'No se pudo validar el envío.' });
    if (!name || name.length > 100 || !['si', 'no'].includes(attendance) || !/^[a-zA-Z0-9-]{10,80}$/.test(id)) {
      return json_({ ok: false, error: 'Revisa tu nombre y la asistencia.' });
    }
    lock = LockService.getScriptLock();
    lock.waitLock(15000);
    const sheet = setup();
    const last = sheet.getLastRow();
    if (last > 1 && sheet.getRange(2, 4, last - 1, 1).createTextFinder(id).matchEntireCell(true).findNext()) {
      return json_({ ok: true, duplicate: true });
    }
    // El apóstrofo evita que el nombre de un invitado se ejecute como fórmula.
    sheet.appendRow([new Date(), safeText_(name), attendance === 'si' ? 'Sí' : 'No', id]);
    SpreadsheetApp.flush();
    return json_({ ok: true });
  } catch (error) {
    console.error('RSVP: ' + String(error));
    return json_({ ok: false, error: 'No se pudo guardar en este momento. Intenta de nuevo en unos segundos.' });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function safeText_(value) { return /^[\s]*[=+@-]/.test(value) ? "'" + value : value; }
function json_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
