{
    'name': "equip1_node8_automation",

    'summary': "OCR Document Processor with Camera Integration",

    'description': """
This module provides OCR document processing with direct camera integration.
Features:
- Capture documents directly from camera
- Process images to extract text
- Convert to Excel format
- Detect grid lines in documents
    """,

    'author': "My Company",
    'website': "https://www.yourcompany.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/15.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Productivity',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base', 'mail', 'web'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/views.xml',
        'views/templates.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'equip1_node8_automation/static/src/js/camera_capture.js',
            'equip1_node8_automation/static/src/xml/camera_template.xml',
            'equip1_node8_automation/static/src/css/camera_styles.css',
        ],
    },
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
    
    'installable': True,
    'application': True,
    'auto_install': False,
    'external_dependencies': {
        'python': ['pytesseract', 'opencv-python-headless', 'numpy', 'openpyxl'],
    },
}
