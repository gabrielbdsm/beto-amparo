import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const data = [
  { name: 'Seg', visitas: 120 },
  { name: 'Ter', visitas: 98 },
  { name: 'Qua', visitas: 150 },
  { name: 'Qui', visitas: 200 },
  { name: 'Sex', visitas: 80 },
  { name: 'Sab', visitas: 50 },
  { name: 'Dom', visitas: 90 },
];

export default function Grafico() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-white">
      <h2 className="text-2xl font-bold mb-8 text-center">Visitas por Dia</h2>
      <div className="w-full max-w-4xl h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="visitas" fill="#3681B6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
