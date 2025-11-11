using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.ExceptionServices;
using System.Text;
using System.Threading.Tasks;

namespace ConsoleApp1
{
    internal class Program
    {
        static void Insert(ref int[] array, int value, int index)
        {
            int[] newArray = new int[array.Length + 1];
            for (int i = 0; i < array.Length; i++)
            {
                newArray[i] = array[i];

            }
            newArray[index] = value;
            for (int i = index; i < array.Length; i++)
            {
                newArray[i+1] = array[i];
            }
            array = newArray;
        }

        static void Main(string[] args)
        {
            int[] myArray = { 1, 4, 8, 2 };
            Insert(ref myArray, -5, 2);
            for (int i = 0; i < myArray.Length; i++)
            {
                Console.WriteLine(myArray[i]);
            }

        }
    }
}
