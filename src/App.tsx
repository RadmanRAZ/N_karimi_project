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
  const [categories, setCategories] = useState<string[]>([])






  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(file)
      const arrayBuffer = await response.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(sheet)
      const monthMapping: { [key: number]: string } = {
        1: "دی",
        2: "بهمن",
        3: "اسفند",
        4: "فروردین",
        5: "اردیبهشت",
        6: "خرداد",
        7: "تیر",
        8: "مرداد",
        9: "شهریور",
        10: "مهر",
        11: "آبان",
        12: "آذر",
      }


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


      const groupedSalesData: { [key: string]: any } = {}
      const uniqueCategories: Set<string> = new Set()
      jsonData.forEach((row: any) => {
        const month = monthMapping[row["ماه"]] || row["ماه"]
        const category = row["دسته کسب و کار"]
        uniqueCategories.add(category)
        if (!groupedSalesData[month]) {
          groupedSalesData[month] = { ماه: month }
        }
        groupedSalesData[month][category] = (groupedSalesData[month][category] || 0) + (row["فروش داخلی (حجمی)"] || 0)
      })
      setCategories(Array.from(uniqueCategories))
      setBarData(Object.values(groupedSalesData))




      // Transform data for the Bar Chart (total sales per category)
      const categorySales: { [key: string]: number } = {}
      jsonData.forEach((row: any) => {
        if (!categorySales[row["دسته کسب و کار"]]) categorySales[row["دسته کسب و کار"]] = 0
        categorySales[row["دسته کسب و کار"]] += row["فروش داخلی (حجمی)"]
      })
      // setBarData(Object.entries(categorySales).map(([name, value]) => ({ name, value })))

      const treemapCategories: TreemapData[] = Object.entries(categorySales).map(([name, value]) => ({
        name,
        value,
      }))
      setTreemapData(treemapCategories)
    }


    fetchData()
  }, [file])

  const CustomTreemapContent = (props: any) => {
    const { x, y, width, height, name, value , index } = props
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} style={{ fill: COLORS[index % COLORS.length] }} />
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

  const COLORS = ["#0088FE", "#FFBB28", "#00C49F", "#FF8042", "#8884D8", "#82CA9D"]
  return (
    <div className="bg-gray-50 min-h-screen p-6 max-[415px]:p-0">
      <div className="mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-right ">نمودار های فروش</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">روند فروش</h2>
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
                  <Line type="monotone" dataKey="فلزی" name="فلزی" stroke={COLORS[1]} strokeWidth={2} dot={true} />
                  <Line type="monotone" dataKey="پالایشی" name="پالایشی" stroke={COLORS[2]} strokeWidth={2} dot={true} />
                  <Line type="monotone" dataKey="معدنی" name="معدنی" stroke={COLORS[3]} strokeWidth={2} dot={true} />
                  <Line type="monotone" dataKey="کشاورزی" name="کشاورزی" stroke={COLORS[4]} strokeWidth={2} dot={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">فروش تجمعی</h2>
              <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ماه" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {categories.map((category, index) => (
                      <Bar key={index} dataKey={category} stackId="a" fill={`hsl(${index * 50}, 70%, 50%)`} name={category} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">فروش بر اساس کسب وکار</h2>
              <ResponsiveContainer width="100%" height={300}>
                <Treemap data={treemapData} dataKey="value" stroke="#fff" fill="#3b82f6" content={<CustomTreemapContent />} />
              </ResponsiveContainer>

            </div>
            <div className="bg-white p-4 rounded-lg shadow-lg">
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

            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold">نمودار نسبت فروش داخلی به صادرات</h2>
              <ResponsiveContainer width="100%" height={300}>
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
        </div>

      </div>

    </div>

  )
}

export default ChartComponent
