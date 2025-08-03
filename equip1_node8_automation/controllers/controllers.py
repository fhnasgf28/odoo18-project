# from odoo import http


# class Equip1Node8Automation(http.Controller):
#     @http.route('/equip1_node8_automation/equip1_node8_automation', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/equip1_node8_automation/equip1_node8_automation/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('equip1_node8_automation.listing', {
#             'root': '/equip1_node8_automation/equip1_node8_automation',
#             'objects': http.request.env['equip1_node8_automation.equip1_node8_automation'].search([]),
#         })

#     @http.route('/equip1_node8_automation/equip1_node8_automation/objects/<model("equip1_node8_automation.equip1_node8_automation"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('equip1_node8_automation.object', {
#             'object': obj
#         })

