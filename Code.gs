/** RSVP de Emili. Pegar en Extensiones > Apps Script del Google Sheet. */
const CONFIG = {
  SPREADSHEET_ID: 'PEGA_AQUI_EL_ID_DE_TU_GOOGLE_SHEET',
  SHEET_NAME: 'Confirmaciones'
};
const HEADERS = ['Timestamp', 'Nombre', 'Asistirá', 'Personas', 'Mensaje', 'ID de envío'];

function setup() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  ss.setSpreadsheetTimeZone('America/Mexico_City');
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#d0b3e8');
    sheet.setFrozenRows(1);
    sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.autoResizeColumns(1, HEADERS.length);
  }
  return sheet;
}

function doGet() {
  return json_({ ok: true, service: 'RSVP Emili', message: 'Envía una solicitud POST para registrar tu respuesta.' });
}

function doPost(e) {
  let lock;
  try {
    const p = e && e.parameter || {};
    const name = String(p.name || '').trim();
    const message = String(p.message || '').trim();
    const attendance = p.attendance;
    const guests = Number(p.guests);
    const id = String(p.requestId || '');
    if (p.website) return json_({ ok: false, error: 'No se pudo validar el envío.' });
    if (!name || name.length > 100 || message.length > 500 || !['si', 'no'].includes(attendance) || !/^[a-zA-Z0-9-]{10,80}$/.test(id)) {
      return json_({ ok: false, error: 'Revisa el nombre, la asistencia y el mensaje.' });
    }
    if (!Number.isInteger(guests) || (attendance === 'si' && (guests < 1 || guests > 20)) || (attendance === 'no' && guests !== 0)) {
      return json_({ ok: false, error: 'Indica de 1 a 20 personas si asistirás, o 0 si no asistirás.' });
    }
    lock = LockService.getScriptLock();
    lock.waitLock(15000);
    const sheet = setup();
    const last = sheet.getLastRow();
    if (last > 1 && sheet.getRange(2, 6, last - 1, 1).createTextFinder(id).matchEntireCell(true).findNext()) {
      return json_({ ok: true, duplicate: true });
    }
    // El apóstrofo evita que texto de un invitado se ejecute como fórmula.
    sheet.appendRow([new Date(), safeText_(name), attendance === 'si' ? 'Sí' : 'No', guests, safeText_(message), id]);
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
