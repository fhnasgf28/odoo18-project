from odoo import models, fields, api


class StockPicking(models.Model):
    _inherit = 'stock.picking'
    _description = 'stock picking inherit'

#     episode pertama
    driver_name = fields.Char(string="Driver Name")
    vehicle_plate = fields.Char(string="Vehicle Plate")



