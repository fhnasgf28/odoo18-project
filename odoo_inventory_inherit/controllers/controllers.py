# from odoo import http


# class OdooInventoryInherit(http.Controller):
#     @http.route('/odoo_inventory_inherit/odoo_inventory_inherit', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/odoo_inventory_inherit/odoo_inventory_inherit/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('odoo_inventory_inherit.listing', {
#             'root': '/odoo_inventory_inherit/odoo_inventory_inherit',
#             'objects': http.request.env['odoo_inventory_inherit.odoo_inventory_inherit'].search([]),
#         })

#     @http.route('/odoo_inventory_inherit/odoo_inventory_inherit/objects/<model("odoo_inventory_inherit.odoo_inventory_inherit"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('odoo_inventory_inherit.object', {
#             'object': obj
#         })

