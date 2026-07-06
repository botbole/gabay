"""
Backward-compatibility shim.

All synagogue routes are now served by the individual module routers
registered via the Module Registry in main.py.

This file is kept so that any legacy import of this module does not
break existing code, but it does not define any routes.
"""
