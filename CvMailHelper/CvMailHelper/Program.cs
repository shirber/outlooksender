
using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using Outlook = Microsoft.Office.Interop.Outlook;

namespace CvMailHelper
{
    public class MailRequest
    {
        public string[] To { get; set; } = Array.Empty<string>();
        public string Subject { get; set; } = "";
        public string Body { get; set; } = "";
        public string AttachmentUrl { get; set; } = "";
    }

    class Program
    {
        static void Main(string[] args)
        {

            try
            {
                if (args.Length == 0 || !args[0].StartsWith("cvmail://"))
                {
                    Console.WriteLine("Error: Application was launched without a valid cvmail:// link.");
                }
                else
                {
                    // 1. פיענוח הנתונים מהקישור
                    string encodedData = args[0].Split(new[] { "data=" }, StringSplitOptions.None)[1];
                    string jsonString = Encoding.UTF8.GetString(Convert.FromBase64String(encodedData));
                    MailRequest request = JsonSerializer.Deserialize<MailRequest>(jsonString);
                    Console.WriteLine("Data decoded successfully.");

                    // 2. הורדת הקובץ המצורף מהשרת
                    string tempAttachmentPath = null;
                    string original_filename = "attachment"; // שם ברירת מחדל
                    if (!string.IsNullOrEmpty(request.AttachmentUrl))
                    {
                        Console.WriteLine($"Attempting to download file from: {request.AttachmentUrl}");
                        using (var client = new HttpClient())
                        {
                            var response = client.GetAsync(request.AttachmentUrl).GetAwaiter().GetResult();
                            response.EnsureSuccessStatusCode();

                            original_filename = response.Content.Headers?.ContentDisposition?.FileName?.Trim('"') ?? original_filename;
                            tempAttachmentPath = Path.Combine(Path.GetTempPath(), original_filename);

                            using (var fs = new FileStream(tempAttachmentPath, FileMode.Create))
                            {
                                response.Content.CopyToAsync(fs).GetAwaiter().GetResult();
                            }
                            Console.WriteLine($"SUCCESS: File downloaded to {tempAttachmentPath}");
                        }
                    }

                    // 3. יצירת החיבור ל-Outlook
                    var outlookApp = new Outlook.Application();

                    // 4. לולאה ליצירת הטיוטות
                    foreach (var recipient in request.To)
                    {
                        Outlook.MailItem mailItem = (Outlook.MailItem)outlookApp.CreateItem(Outlook.OlItemType.olMailItem);
                        mailItem.To = recipient;
                        mailItem.Subject = request.Subject;
                        mailItem.HTMLBody = request.Body;

                        // הוספת הקובץ המצורף אם הוא הורד בהצלחה
                        if (tempAttachmentPath != null && File.Exists(tempAttachmentPath))
                        {
                            mailItem.Attachments.Add(tempAttachmentPath, Outlook.OlAttachmentType.olByValue, 1, original_filename);
                        }

                        mailItem.Display(false);
                    }

                    // 5. ניקוי הקובץ הזמני
                    if (tempAttachmentPath != null && File.Exists(tempAttachmentPath))
                    {
                        File.Delete(tempAttachmentPath);
                        Console.WriteLine("SUCCESS: Temporary file deleted.");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("\n!!! AN ERROR OCCURRED !!!\n");
                Console.WriteLine(ex.ToString());
                File.WriteAllText(Path.Combine(Path.GetTempPath(), "CvMailHelper_ErrorLog.txt"), ex.ToString());
            }

            Console.ReadKey();
        }
    }
}