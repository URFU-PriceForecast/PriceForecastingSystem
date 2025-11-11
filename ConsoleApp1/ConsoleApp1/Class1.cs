using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ConsoleApp1
{
    internal class Class1
    {
        static int Sum(int a, int b, bool enableLogging = false)
        {
            int result = a + b;
            if (enableLogging)
            {
                Console.WriteLine($"Значение результата {result}");
            }
            return result;  
        }
        static void Main(string[] args)
        {
            int result = Sum(1, 5, false);
        }
    }
}
