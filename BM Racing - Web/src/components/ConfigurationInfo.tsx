import React, { useEffect, useState } from "react";
import api from "../services/api";
import { CreateConfiguration } from "../utils/commonTypes";

type ConfigurationInfoProps = {
  id: number | null;
};

const ConfigurationInfo = ({ id }: ConfigurationInfoProps) => {
  const [configurationData, setConfigurationData] = useState<CreateConfiguration | null>(null);

  useEffect(() => {
    const fetchConfiguration = async () => {
      if (id) {
        try {
          const response = await api.getConfigurationById(id);
          console.log(response.data.data);
          setConfigurationData(response.data.data);
        } catch (error) {
          console.error("Error fetching configuration data:", error);
        }
      }
    };

    fetchConfiguration();
  }, [id]);

  if (!configurationData) {
    return <div className="text-center text-gray-500 py-80">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Informace o konfiguraci</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 pb-2">
        <div className="mb-2">
            <h2 className="text-lg font-semibold">Poznámka:</h2>
            <p className="text-gray-700">{configurationData.note}</p>
        </div>
        <div className="mb-2">
            <h2 className="text-lg font-semibold">Výkon:</h2>
            <p className="text-gray-700">{configurationData.power} kw</p>
        </div>
        <div className="mb-2">
            <h2 className="text-lg font-semibold">Hmotnost:</h2>
            <p className="text-gray-700">{configurationData.weight} kg</p>
        </div>
        <div className="mb-2">
            <h2 className="text-lg font-semibold">Poměr výkonu a hmotnosti:</h2>
            <p className="text-gray-700">{configurationData.power_weight_ratio}</p>
        </div>
        <div className="mb-2">
            <h2 className="text-lg font-semibold">Vylepšení aerodynamiky:</h2>
            <p className="text-gray-700">{configurationData.aero_upgrade ? 'ANO' : 'NE'}</p>
        </div>
        <div className="mb-2">
            <h2 className="text-lg font-semibold">Nadměrné úpravy:</h2>
            <p className="text-gray-700">{configurationData.excessive_modifications ? 'ANO' : 'NE'}</p>
        </div>
        <div className="mb-2">
            <h2 className="text-lg font-semibold">Nadměrné odklony:</h2>
            <p className="text-gray-700">{configurationData.excessive_chamber ? 'ANO' : 'NE'}</p>
        </div>
        <div className="mb-2">
            <h2 className="text-lg font-semibold">Únik kapalin:</h2>
            <p className="text-gray-700">{configurationData.liquid_leakage ? 'ANO' : 'NE'}</p>
        </div>
        <div className="mb-2">
            <h2 className="text-lg font-semibold">Zadní světla:</h2>
            <p className="text-gray-700">{configurationData.rear_lights ? 'ANO' : 'NE'}</p>
        </div>
        <div className="mb-2">
            <h2 className="text-lg font-semibold">Bezpečné:</h2>
            <p className="text-gray-700">{configurationData.safe ? 'ANO' : 'NE'}</p>
        </div>
        <div className="mb-2">
            <h2 className="text-lg font-semibold">Legální silniční pneumatiky:</h2>
            <p className="text-gray-700">{configurationData.street_legal_tires ? 'ANO' : 'NE'}</p>
        </div>
        <div className="mb-2">
            <h2 className="text-lg font-semibold">Sedadlo nebo klec na bezpečnostní pásy:</h2>
            <p className="text-gray-700">{configurationData.seat_seatbelt_cage ? 'ANO' : 'NE'}</p>
        </div>
        <div className="mb-2">
            <h2 className="text-lg font-semibold">Rozšířená karoserie:</h2>
            <p className="text-gray-700">{configurationData.widebody ? 'ANO' : 'NE'}</p>
        </div>
        <div className="mb-2">
            <h2 className="text-lg font-semibold">Široké pneumatiky</h2>
            <p className="text-gray-700">{configurationData.wide_tires ? 'ANO' : 'NE'}</p>
        </div>
        </div>
    </div>
  );
};

export default ConfigurationInfo;