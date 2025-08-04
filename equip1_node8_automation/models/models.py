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

