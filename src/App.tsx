import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, CartesianGrid, Treemap } from "recharts";

interface ChartComponentProps {
  file: string;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ file }) => {
  interface LineChartData {
    time: string;
    [key: string]: any;
  }

  interface BarChartData {
    name: string;
    value: number;
  }

  interface TreemapData {
    name: string;
    value: number;
    children?: TreemapData[];
  }

  const [data, setData] = useState<LineChartData[]>([]);
  const [barData, setBarData] = useState<BarChartData[]>([]);
  const [treemapData, setTreemapData] = useState<TreemapData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(file);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // Transform data for the Line Chart (trend analysis)
      const groupedData: { [key: string]: { time: string; [key: string]: any } } = {};
      jsonData.forEach((row: any) => {
        const key = `${row["سال"]}-${row["ماه"]}`;
        if (!groupedData[key]) groupedData[key] = { time: key };
        groupedData[key][row["دسته کسب و کار"]] = row["فروش داخلی (حجمی)"];
      });
      setData(Object.values(groupedData));

      // Transform data for the Bar Chart (total sales per category)
      const categorySales: { [key: string]: number } = {};
      jsonData.forEach((row: any) => {
        if (!categorySales[row["دسته کسب و کار"]]) categorySales[row["دسته کسب و کار"]] = 0;
        categorySales[row["دسته کسب و کار"]] += row["فروش داخلی (حجمی)"];
      });
      setBarData(Object.entries(categorySales).map(([name, value]) => ({ name, value })));

      // Transform data for the Treemap (business categories and sales volume)
      const treemapCategories: TreemapData[] = Object.entries(categorySales).map(([name, value]) => ({
        name,
        value,
      }));
      setTreemapData(treemapCategories);
    };

    fetchData();
  }, [file]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <h2>نمودار روند فروش</h2>
        <LineChart width={600} height={300} data={data}>
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="فلزی" stroke="#8884d8" />
          <Line type="monotone" dataKey="پالایشی" stroke="#82ca9d" />
        </LineChart>
      </div>

      <div>
        <h2>نمودار فروش تجمعی</h2>
        <BarChart width={600} height={300} data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </div>

      <div>
        <h2>نمودار درختی دسته‌های کسب و کار</h2>
        <Treemap
          width={600}
          height={300}
          data={treemapData}
          dataKey="value"
          stroke="#fff"
          fill="#8884d8"
        />
      </div>
    </div>
  );
};

export default ChartComponent;
