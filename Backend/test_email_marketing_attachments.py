import unittest

from plugins.sales_email_marketing.main import PluginMain


class EmailMarketingAttachmentValidationTests(unittest.TestCase):
    def test_accepts_supported_attachments(self):
        plugin = PluginMain()
        payload = plugin.validate_attachment_payloads([
            {
                "filename": "report.pdf",
                "content_type": "application/pdf",
                "content_base64": "dGVzdA==",
            }
        ])

        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["filename"], "report.pdf")
        self.assertEqual(payload[0]["content_type"], "application/pdf")

    def test_rejects_unsupported_extension(self):
        plugin = PluginMain()

        with self.assertRaises(Exception):
            plugin.validate_attachment_payloads([
                {
                    "filename": "archive.exe",
                    "content_type": "application/x-msdownload",
                    "content_base64": "dGVzdA==",
                }
            ])


if __name__ == "__main__":
    unittest.main()
