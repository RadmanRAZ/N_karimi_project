"use client"

import type React from "react"
import { useState, useEffect } from "react"
import * as XLSX from "xlsx"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  Treemap,
  ResponsiveContainer,
  PieChart,
  Cell,
  Pie,
} from "recharts"

interface ChartComponentProps {
  file: string
}

const ChartComponent: React.FC<ChartComponentProps> = ({ file }) => {
  interface LineChartData {
    time: string
    [key: string]: any
  }

  interface BarChartData {
    name: string
    value: number
  }

  interface TreemapData {
    name: string
    value: number
    children?: TreemapData[]
  }

  const [data, setData] = useState<LineChartData[]>([])
  const [barData, setBarData] = useState<BarChartData[]>([])
  const [treemapData, setTreemapData] = useState<TreemapData[]>([])
  const [salesData, setSalesData] = useState<any[]>([])
  const [pieData, setPieData] = useState<any[]>([])

 




  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(file)
      const arrayBuffer = await response.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(sheet)
     

      // Transform data for the sales comparison bar chart
      const transformedSalesData = jsonData.map((row: any) => ({
        دسته: row["دسته کسب و کار"],
        ماه: row["ماه"],
        فروش_داخلی: row["فروش داخلی (ریال)"] || 0,
        صادرات: row["صادرات"] || 0,
      }))
      setSalesData(transformedSalesData)

      // Transform data for the pie chart (sales ratio)
      const totalDomestic = jsonData.reduce((acc: number, row: any) => acc + (row["فروش داخلی (ریال)"] || 0), 0)
      const totalExports = jsonData.reduce((acc: number, row: any) => acc + (row["صادرات"] || 0), 0)
      setPieData([
        { name: "فروش داخلی", value: totalDomestic },
        { name: "صادرات", value: totalExports },
      ])

      // Transform data for the Line Chart (trend analysis)
      const groupedData: { [key: string]: { time: string;[key: string]: any } } = {}
      jsonData.forEach((row: any) => {
        const key = `${row["سال"]}-${row["ماه"]}`
        if (!groupedData[key]) groupedData[key] = { time: key }
        groupedData[key][row["دسته کسب و کار"]] = row["فروش داخلی (حجمی)"]
      })
      setData(Object.values(groupedData))
      

      

      // Transform data for the Bar Chart (total sales per category)
      const categorySales: { [key: string]: number } = {}
      jsonData.forEach((row: any) => {
        if (!categorySales[row["دسته کسب و کار"]]) categorySales[row["دسته کسب و کار"]] = 0
        categorySales[row["دسته کسب و کار"]] += row["فروش داخلی (حجمی)"]
      })
      setBarData(Object.entries(categorySales).map(([name, value]) => ({ name, value })))

      const treemapCategories: TreemapData[] = Object.entries(categorySales).map(([name, value]) => ({
        name,
        value,
      }))
      setTreemapData(treemapCategories)
    }
    

    fetchData()
  }, [file])

  const CustomTreemapContent = (props: any) => {
    const { x, y, width, height, name, value } = props
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} style={{ fill: props.fill }} />
        {width > 50 && height > 30 ? (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 12}
              textAnchor="middle"
              fill="#fff"
              fontSize={12}
              fontWeight="bold"
            >
              {name}
            </text>
            <text x={x + width / 2} y={y + height / 2 + 12} textAnchor="middle" fill="#fff" fontSize={12}>
              {value}
            </text>
          </>
        ) : null}
      </g>
    )
  }

  const COLORS = ["#0088FE", "#FFBB28"]
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Spend Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => {
                const [year, month] = value.split("-")
                const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
                return new Intl.DateTimeFormat("fa-IR", { month: "long" }).format(date)
              }}
            />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="فلزی" name="Metal" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="پالایشی" name="Refinery" stroke="#60a5fa" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Spend by Region</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart layout="vertical" data={barData}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Spend by Category</h2>
        <ResponsiveContainer width="100%" height={300}>
          <Treemap data={treemapData} dataKey="value" stroke="#fff" fill="#3b82f6" content={<CustomTreemapContent />} />
        </ResponsiveContainer>

      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold">نمودار فروش داخلی و صادرات</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ماه" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="فروش_داخلی" fill="#3b82f6" name="فروش داخلی" barSize={60} />
            <Bar dataKey="صادرات" fill="#ffbb28" name="صادرات" barSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold">نمودار نسبت فروش داخلی به صادرات</h2>

        <ResponsiveContainer width="50%" height={300}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value">
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

      </div>
    </div>
  )
}

export default ChartComponent
