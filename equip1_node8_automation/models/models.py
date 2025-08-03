# from odoo import models, fields, api


# class equip1_node8_automation(models.Model):
#     _name = 'equip1_node8_automation.equip1_node8_automation'
#     _description = 'equip1_node8_automation.equip1_node8_automation'

#     name = fields.Char()
#     value = fields.Integer()
#     value2 = fields.Float(compute="_value_pc", store=True)
#     description = fields.Text()
#
#     @api.depends('value')
#     def _value_pc(self):
#         for record in self:
#             record.value2 = float(record.value) / 100

