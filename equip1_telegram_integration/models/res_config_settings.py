from odoo import models, fields

class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    telegram_bot_token = fields.Char(string='Telegram Bot Token', config_parameter='telegram.po_bot_token')
    telegram_manager_chat_id = fields.Char(string='Manager Chat ID', config_parameter='telegram.po_manager_chat_id')
    telegram_webhook_url = fields.Char(string='Odoo Webhook URL', help="URL publik Odoo untuk menerima respon dari Telegram. Contoh: https://xxxx.ngrok.io", config_parameter='telegram.po_webhook_url')