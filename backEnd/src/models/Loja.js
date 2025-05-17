export default (sequelize, DataTypes) => {
  const Loja = sequelize.define(
    'Loja',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nome_fantasia: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cor_primaria: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cor_secundaria: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slogan: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      foto_loja: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      slug_loja: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          is: /^[a-z0-9-]+$/ // Apenas letras minúsculas, números e hífens
        }
      },
    },
    {
      tableName: 'loja',
      timestamps: true,
    }
  );

  return Loja;
};

export async function buscarLojaBySlug(slug) {
  const { data, error } = await supabase
    .from('loja')
    .select('*')
    .eq('slug_loja', slug)
    .single();

  if (error) throw error;
  return data;
};

