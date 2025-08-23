import requests
from odoo import models, fields, api, _
import json
import logging

_logger = logging.getLogger(__name__)

class PurchaseOrder(models.Model):
    _inherit = 'purchase.order'

    telegram_approval_sent = fields.Boolean('Telegram Approval Sent', default=False, copy=False)

    def button_confirm(self):
        res = super(PurchaseOrder, self).button_confirm()
        for order in self:
            print("ini adalah button confirm")
            order._send_telegram_approval_request()
        return res

    def _send_telegram_approval_request(self):
        self.ensure_one()
        ICP = self.env['ir.config_parameter'].sudo()
        bot_token = ICP.get_param('telegram.po_bot_token')
        chat_id = ICP.get_param('telegram.po_manager_chat_id')
        if not bot_token or not chat_id:
            print('Telegram PO bot token or chat ID not configured')
            return

        message = (
            f"🔔 *Permintaan Persetujuan PO*\n\n"
            f"*Nomor:* {self.name}\n"
            f"*Vendor:* {self.partner_id.name}\n"
            f"*Total:* {self.amount_total:,.2f} {self.currency_id.symbol}\n\n"
            f"Mohon tinjau dan berikan persetujuan Anda."
        )
        # membuat tombol interaktif
        keyboard = {
            'inline_keyboard': [[
                {'text': '✅ Setujui', 'callback_data': f'po_approve_{self.id}'},
                {'text': '❌ Tolak', 'callback_data': f'po_reject_{self.id}'}
            ]]
        }

        api_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            'chat_id': chat_id,
            'text': message,
            'parse_mode':'Markdown',
            'reply_markup': json.dumps(keyboard)
        }

        try:
            response = requests.post(api_url, json=payload, timeout=10)
            response.raise_for_status()
            self.write({'telegram_approval_sent': True})
            print(f"Permintaan persetujuan untuk PO {self.name} terkirim ke Telegram.")
        except requests.exceptions.RequestException as e:
            print(f"Gagal mengirim permintaan persetujuan PO {self.name}: {e}")