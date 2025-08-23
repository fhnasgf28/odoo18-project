import json
import logging
import requests
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)

class TelegramWebhookController(http.Controller):
    @http.route('/telegram/po/webhook', type='json', auth='public', methods=['POST'], csrf=False)
    def telegram_webhook(self, **kwargs):
        data = json.loads(request.httprequest.data)
        print("Menerima webhook dari telegram: %s", data)

        if 'callback_query' in data:
            callback_data = data['callback_query']['data']
            chat_id = data['callback_query']['message']['chat']['id']
            message_id = data['callback_query']['message']['message_id']

            try:
                action, record_id = callback_data.split('_',2)[1:]
                record_id = int(record_id)

                PurchaseOrder = request.env['purchase.order'].sudo().browse(record_id)
                if not PurchaseOrder.exists():
                    self._answer_telegram_callback(chat_id, "PO tidak di temukan")
                    return

                if action == 'approve':
                    PurchaseOrder.button_approve()
                    final_text = f"✅ PO {PurchaseOrder.name} telah disetujui."
                elif action == 'reject':
                    PurchaseOrder.button_cancel()
                    final_text = f"❌ PO {PurchaseOrder.name} telah ditolak."
                else:
                    final_text = "Tindakan tidak dikenali."
                self._update_telegram_message(chat_id, message_id, final_text)
            except Exception as e:
                _logger.error("Gagal memproses callback query: %s", e)
                self._answer_telegram_callback(chat_id, "Gagal memproses callback query")
        return 'OK'

    def _get_bot_token(self):
        return request.env['ir.config_parameter'].sudo().get_param('telegram.po_bot_token')

    def _answer_telegram_callback(self, chat_id, text):
        bot_token = self._get_bot_token()
        if not bot_token: return

        api_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            'chat_id': chat_id,
            'text': text,
        }
        requests.post(api_url, json=payload, timeout=5)

    def _update_telegram_message(self, chat_id, message_id, text):
        """Mengedit pesan asli untuk menghapus tombol dan menampilkan status."""
        bot_token = self._get_bot_token()
        if not bot_token: return

        api_url = f"https://api.telegram.org/bot{bot_token}/editMessageText"
        payload = {
            'chat_id': chat_id,
            'message_id': message_id,
            'text': text,
            'reply_markup': json.dumps({})  # Menghapus keyboard
        }
        requests.post(api_url, json=payload, timeout=5)

