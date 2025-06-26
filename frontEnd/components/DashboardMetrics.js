import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Index = (slug) => {
  const slugLoja = slug.slug
  const [ticketData, setTicketData] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [cancelPercent, setCancelPercent] = useState(0);
  let dataATT 
  // Estados dos filtros (apenas período)
  const [dateFilter, setDateFilter] = useState('7d');
  const [currentPeriod, setCurrentPeriod] = useState(0); // 0 = atual, 1 = anterior, etc.

  // Dados originais para aplicar filtros
  const [originalData, setOriginalData] = useState(null);
  const getDateRangeQuery = () => {
    if (dateFilter === 'all') return '';
  
    const days = parseInt(dateFilter);
    const today = new Date();
    const periodStart = new Date(today.getTime() - ((days * (currentPeriod + 1)) * 24 * 60 * 60 * 1000));
    const periodEnd = new Date(today.getTime() - ((days * currentPeriod) * 24 * 60 * 60 * 1000));
  
    // Formatar para YYYY-MM-DD
    const formatDate = d => d.toISOString().split('T')[0];
  
    return `?start=${formatDate(periodStart)}&end=${formatDate(periodEnd)}`;
  };

  function getDate(){
    const query = getDateRangeQuery();

    fetch( `${process.env.NEXT_PUBLIC_EMPRESA_API}/empresa/insights/${slugLoja}${query}`)
      .then(res => res.json())
      .then(data => {
        setOriginalData(data);
        applyFilters(data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });

  }
  useEffect(() => {
    getDate()
    dataATT = new Date().toLocaleTimeString('pt-BR')
  },[dateFilter, currentPeriod], slugLoja);


  useEffect(() => {
    if (originalData) {
      applyFilters(originalData);
    }
  }, [dateFilter, currentPeriod]);

  const applyFilters = (data) => {
    let filteredData = { ...data };

    // Filtro de data com navegação de períodos
    if (dateFilter !== 'all') {
      const days = parseInt(dateFilter);
      const today = new Date();
      
      // Calcular o período baseado no currentPeriod
      const periodStart = new Date(today.getTime() - ((days * (currentPeriod + 1)) * 24 * 60 * 60 * 1000));
      const periodEnd = new Date(today.getTime() - ((days * currentPeriod) * 24 * 60 * 60 * 1000));
      
      // Filtrar ticketPorData
      const filteredTickets = Object.keys(data.ticketPorData)
        .filter(dateKey => {
          const date = new Date(dateKey);
          return date >= periodStart && date < periodEnd;
        })
        .reduce((obj, key) => {
          obj[key] = data.ticketPorData[key];
          return obj;
        }, {});
      
      filteredData.ticketPorData = filteredTickets;
      
    }

    // Processar dados filtrados
    const labels = Object.keys(filteredData.ticketPorData);
    const daily = labels.map(key => filteredData.ticketPorData[key].totalReceita);

    setTicketData({ labels, daily });

    // Métricas
    const receitaTotal = Object.values(filteredData.ticketPorData).reduce((acc, cur) => acc + cur.totalReceita, 0);
    const quantidadeTotal = Object.values(filteredData.ticketPorData).reduce((acc, cur) => acc + cur.totalQuantidade, 0);
    const averageTicket = quantidadeTotal > 0 ? receitaTotal / quantidadeTotal : 0;
    console.log(data)
    setMetrics({
      totalSales: quantidadeTotal,
      totalRevenue: receitaTotal.toFixed(2),
      averageTicket: averageTicket.toFixed(2),
      cancellationRate:  data.pedidosCancelados === 0 ?
      0
      :
      ((data.pedidosCancelados / data.totalPedidos) * 100).toFixed(1),
    });

    // Produtos
    const produtos = data.top5Produtos.map(produto => ({
      name: produto.nome,
      sales: produto.quantidade,
      revenue: produto.preco * produto.quantidade,
    }));
    console.log(produtos)
    
    setTopProducts(produtos);
    setCancelPercent(
      data.pedidosCancelados === 0 ?
      0
      :
      ((data.pedidosCancelados / data.totalPedidos) * 100).toFixed(1));
  };

  const resetFilters = () => {
    setDateFilter('7d');
    setCurrentPeriod(0);
  };

  const getPeriodLabel = () => {
    if (currentPeriod === 0) return 'Período Atual';
    if (currentPeriod === 1) return 'Período Anterior';
    return `${currentPeriod + 1} períodos atrás`;
  };

  const navigatePeriod = (direction) => {
    if (direction === 'prev') {
      setCurrentPeriod(prev => prev + 1);
    } else if (direction === 'next' && currentPeriod > 0) {
      setCurrentPeriod(prev => prev - 1);
    }
  };

  const enhancedDailySalesConfig = {
    labels: ticketData.labels || [],
    datasets: [
      {
        label: 'Vendas (R$)',
        data: ticketData.daily || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        borderWidth: 3,
      },
    ],
  };

  const topProductsConfig = {
    labels: topProducts.map(p => p.name),
    datasets: [
      {
        label: 'Unidades Vendidas',
        data: topProducts.map(p => p.sales),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const cancellationConfig = {
    labels: ['Vendas Concluídas', 'Cancelamentos'],
    datasets: [
      {
        data: [100 - cancelPercent, parseFloat(cancelPercent)],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const enhancedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return ` ${context.parsed.y.toLocaleString('pt-BR')}`;
          }
        }
      },
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return  value.toLocaleString('pt-BR');
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Dashboard de Métricas
          </h1>
          <p className="text-slate-600">
            Insights e análises de vendas em tempo real
          </p>
        </div>

        {/* Filtros Simplificados */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Filtros</h3>
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Limpar Filtros
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Filtro de Período */}
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Período
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
                <option value="all">Todos os períodos</option>
              </select>
            </div>

            {/* Navegação de Períodos */}
            {dateFilter !== 'all' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigatePeriod('prev')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  ← Anterior
                </button>
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
                  {getPeriodLabel()}
                </span>
                <button
                  onClick={() => navigatePeriod('next')}
                  disabled={currentPeriod === 0}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Próximo →
                </button>
              </div>
            )}
          </div>

          {/* Indicador de filtro ativo */}
          {dateFilter !== '7d' && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Período: {dateFilter === 'all' ? 'Todos' : dateFilter}
                <button
                  onClick={() => setDateFilter('7d')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Vendas</p>
                <p className="text-3xl font-bold text-slate-900">
                  {metrics.totalSales}
                </p>
              
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Receita Total</p>
                <p className="text-3xl font-bold text-slate-900">
                  R$ {metrics.totalRevenue}
                </p>
                
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Ticket Médio</p>
                <p className="text-3xl font-bold text-slate-900">
                  R$ {metrics.averageTicket}
                </p>
              
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9a2 2 0 10-4 0v5a2 2 0 01-2 2h6m-6-4h4m8 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Taxa de Cancelamento</p>
                <p className="text-3xl font-bold text-red-600">{metrics.cancellationRate}%</p>

              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Vendas por Dia - Melhorado */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">Vendas por Período</h3>
              <div className="text-sm text-slate-500">
                {getPeriodLabel()}
              </div>
            </div>
            <div className="h-80">
              <Line data={enhancedDailySalesConfig} options={enhancedChartOptions} />
            </div>
          </div>

          {/* Top 5 Produtos */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Top 5 Produtos Vendidos</h3>
            <div className="h-80">
              <Bar data={topProductsConfig} options={enhancedChartOptions} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Taxa de Cancelamento */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Taxa de Cancelamento</h3>
            <div className="h-80">
              <Doughnut data={cancellationConfig} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Tabela de Produtos Detalhada */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 mb-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Produtos Mais Vendidos - Detalhado</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-sm font-semibold text-slate-600">Produto</th>
                  <th className="pb-3 text-sm font-semibold text-slate-600">Unidades Vendidas</th>
                  <th className="pb-3 text-sm font-semibold text-slate-600">Receita Total</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 text-slate-800 font-medium">{product.name}</td>
                    <td className="py-4 text-slate-600">{product.sales}</td>
                    <td className="py-4 text-slate-600">R$ {(product.revenue ).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

    
        
      </div>
    </div>
  );
};

export default Index;
