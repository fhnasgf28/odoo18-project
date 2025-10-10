# models/res_users.py
from odoo import models, fields

class ResUsers(models.Model):
    _inherit = 'res.users'

    telegram_chat_id = fields.Char(string="Telegram Chat ID", copy=False)
    telegram_rejection_po_id = fields.Many2one(
        'purchase.order',
        string="Pending PO Rejection from Telegram",
        help="Technical field to store the PO that the user is currently rejecting via Telegram."
    )