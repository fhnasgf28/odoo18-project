import base64
import io
import pytesseract
from PIL import Image
from openpyxl import Workbook
from odoo import models, fields, api


class OcrDocument(models.Model):
    _name = 'ocr.document'
    _description = 'OCR Document Processor'
    _inherit = ['mail.thread']

    name = fields.Char(string='Document Name', required=True)
    image_file = fields.Binary(string='Upload Image', required=True, attachment=True)
    image_filename = fields.Char(string='Image Filename')
    raw_text = fields.Text(string='Extracted Text', readonly=True)
    excel_file = fields.Binary(string='Generated Excel', readonly=True, attachment=True)
    excel_filename = fields.Char(string='Excel Filename')

    @api.depends('image_file')
    def _compute_raw_text(self):
        for rec in self:
            if rec.image_file:
                try:
                    image_data = base64.b64decode(rec.image_file)
                    image = Image.open(io.BytesIO(image_data))
                    text = pytesseract.image_to_string(image)
                    rec.raw_text = text
                except Exception as e:
                    rec.raw_text = f"Error during OCR: {str(e)}"
            else:
                rec.raw_text = False

    def action_process_document(self):
        self.ensure_one()
        self._compute_raw_text()
        if self.raw_text:
            wb = Workbook()
            ws = wb.active
            ws.title = "Extracted Text"

            lines = self.raw_text.split('\n')
            for i, line in enumerate(lines, start=1):
                ws[f'A{i}'] = line

                # Simpan file Excel ke dalam buffer
                excel_buffer = io.BytesIO()
                wb.save(excel_buffer)
                excel_data = excel_buffer.getvalue()

                # Update field biner di Odoo
                self.write({
                    'excel_file': base64.b64encode(excel_data),
                    'excel_filename': f"{self.name}_output.xlsx"
                })

                # Informasikan user bahwa proses berhasil
                return {
                    'type': 'ir.actions.client',
                    'tag': 'display_notification',
                    'params': {
                        'title': 'Success',
                        'message': 'Document processed and Excel file generated.',
                        'sticky': False,
                        'type': 'success',
                    }
                }

        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': 'Error',
                'message': 'No text could be extracted from the image.',
                'sticky': False,
                'type': 'danger',
            }
        }

