import { useState, useEffect } from "react";
import { useFormik } from "formik";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

const CreateConfigurationForm = ({ route, onConfigurationCreated }: { route: string, onConfigurationCreated: (id: number, power_weight_ratio: number) => void }) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {      
      note: '',
      power: 0,
      weight: 0,
      power_weight_ratio: '',
      aero_upgrade: 0.003,
      excessive_modifications: false,
      excessive_chamber: '0',
      liquid_leakage: false,
      rear_lights: false,
      safe: false,
      street_legal_tires: '0',
      seat: '0',
      seatbelt: '0',
      widebody: '0',
      wide_tires: '0.005',
    },
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values) => {
      try {
        console.log(
          "note: " + values.note + "\n",
          "power: " + values.power + "\n",
          "weight: " + values.weight + "\n",
          "power_weight_ratio: " + values.power_weight_ratio + "\n",
          "aero_upgrade: " + values.aero_upgrade + "\n",
          "excessive_modifications: " + values.excessive_modifications + "\n",
          "excessive_chamber: " + values.excessive_chamber + "\n",
          "liquid_leakage: " + values.liquid_leakage + "\n",
          "rear_lights: " + values.rear_lights + "\n",
          "safe: " + values.safe + "\n",
          "street_legal_tires: " + values.street_legal_tires + "\n", 
          "seat: " + values.seat + "\n",
          "seatbelt: " + values.seatbelt + "\n",
          "widebody: " + values.widebody + "\n",
          "wide_tires: " + values.wide_tires
        );

        const response = await api.createConfiguration(values.note, values.power, values.weight, Number(values.power_weight_ratio), Number(values.aero_upgrade), values.excessive_modifications, Number(values.excessive_chamber), values.liquid_leakage, values.rear_lights, values.safe, Number(values.street_legal_tires), Number(values.seat), Number(values.seatbelt), Number(values.widebody), Number(values.wide_tires));

        onConfigurationCreated(response.data.car_configuration_id, Number(values.power_weight_ratio));

        toast.success('Nová konfigurace byla úspěšně vytvořena!');
        navigate(route);
      } catch (error: any) {
        console.error('API Error:', error.response);
        if (error.response && error.response.data) {
          console.error('Response data:', error.response.data);
        }
        setSubmitError(error.response?.data?.message || 'Nepodařilo se vytvořit konfiguraci.');
      }
      
    },
    validate: (values) => {
      const errors: any = {};

      if (!values.power) {
        errors.power = "Vyplňte výkon";
      }
      if (!values.weight) {
        errors.weight = "Vyplňte hmotnost";
      }
      if (!values.power_weight_ratio) {
        errors.power_weight_ratio = "Vyplňte poměr výkonu a hmotnosti";
      }

      return errors;
    },
  });

  useEffect(() => {
    const power = parseFloat(formik.values.power.toString());
    const weight = parseFloat(formik.values.weight.toString());
    const aeroUpgrade = parseFloat(formik.values.aero_upgrade.toString());
    const excessiveChamber = parseFloat(formik.values.excessive_chamber.toString());
    const widebody = parseFloat(formik.values.widebody.toString());
    const streetLegalTires = parseFloat(formik.values.street_legal_tires.toString());
    const wideTires = parseFloat(formik.values.wide_tires.toString());
    const seat = parseFloat(formik.values.seat.toString());
    const seatbelt = parseFloat(formik.values.seatbelt.toString());

    if (!isNaN(power) && !isNaN(weight) && weight !== 0) {
      const ratio = (((power / weight) + aeroUpgrade + excessiveChamber + widebody + streetLegalTires + wideTires + seat + seatbelt) * 1000).toFixed(1);
        formik.setFieldValue('power_weight_ratio', ratio);
    } else {
        formik.setFieldValue('power_weight_ratio', '');
    }
    //eslint-disable-next-line
}, [formik.values.power, formik.values.weight, formik.values.aero_upgrade, formik.values.excessive_chamber, formik.values.widebody, formik.values.street_legal_tires, formik.values.wide_tires, formik.values.seat, formik.values.seatbelt]);

  return (
    <div className="flex w-fit px-4 sm:px-0 lg:px-10 justify-center pt-2">
      <div className="">
        <form onSubmit={formik.handleSubmit}>
          <div className="w-full text-center">
            <h1 className="font-body text-5xl font-medium py-2">
              Vytvoření konfigurace
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-2">
          <div className="flex flex-col font-body my-1">
                <label htmlFor="note" className="text-black">
                  Poznámka
                </label>
                <input
                  type="text"
                  id="note"
                  name="note"
                  onChange={formik.handleChange}
                  value={formik.values.note}
                  className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                  placeholder="např. Toyota Supra, Martin Zahrádka 23.08.2024"
                />
                {formik.errors.note ? (
                  <div className="text-red-600">{formik.errors.note}</div>
                ) : null}
              </div>

              <div className="flex flex-col font-body my-1">
                <label htmlFor="power" className="text-black">
                  Výkon* [kw]
                </label>
                <input
                  type="number"
                  id="power"
                  name="power"
                  onChange={formik.handleChange}
                  value={formik.values.power}
                  className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                  placeholder="např. 124"
                  min={0}
                />
                {formik.errors.power ? (
                  <div className="text-red-600">{formik.errors.power}</div>
                ) : null}
              </div>

              <div className="flex flex-col font-body my-1">
                <label htmlFor="weight" className="text-black">
                  Hmotnost* [kg]
                </label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  onChange={formik.handleChange}
                  value={formik.values.weight}
                  className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                  placeholder="např. 1300"
                  min={0}
                />
                {formik.errors.weight ? (
                  <div className="text-red-600">{formik.errors.weight}</div>
                ) : null}
              </div>

              <div className="flex flex-col font-body my-1">
                <label htmlFor="power_weight_ratio" className="text-black">
                  Poměr výkonu a hmotnosti:
                </label>
                <input
                  type="text"
                  id="power_weight_ratio"
                  name="power_weight_ratio"
                  value={formik.values.power_weight_ratio}
                  className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                  placeholder="0"
                  readOnly
                />
                {formik.errors.power_weight_ratio ? (
                  <div className="text-red-600">{formik.errors.power_weight_ratio}</div>
                ) : null}
              </div>

              <div className="flex flex-col font-body my-1 custom-select">
                  <label htmlFor="aero_upgrade" className="text-black">
                      Vylepšení aerodynamiky* (0.003 - 0.03)
                  </label>
                  <input
                      type="number"
                      id="aero_upgrade"
                      name="aero_upgrade"
                      onChange={formik.handleChange}
                      value={formik.values.aero_upgrade}
                      className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                      placeholder="0"
                      step="0.001"
                      min={0.003}
                      max={0.03}
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        if (target.valueAsNumber < 0.003) {
                            target.value = "0.003";
                        }
                        if (target.valueAsNumber > 0.03) {
                            target.value = "0.03";
                        }
                    }}
                  />
                  {formik.errors.aero_upgrade ? (
                      <div className="text-red-600">{formik.errors.aero_upgrade}</div>
                  ) : null}
              </div>

              <div className="flex flex-col font-body my-1 custom-select">
                <label htmlFor="excessive_modifications" className="text-black">
                  Prototyp / Monopost / S1+
                </label>
                <select
                  name="excessive_modifications"
                  id="excessive_modifications"
                  onChange={(e) => formik.setFieldValue('excessive_modifications', e.target.value === 'true')}
                  value={formik.values.excessive_modifications ? "true" : "false"}
                  className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                >
                  <option value='true'>ANO</option>
                  <option value='false'>NE</option>
                </select>

                {formik.errors.excessive_modifications ? (
                  <div className="text-red-600">{formik.errors.excessive_modifications}</div>
                ) : null}
              </div>

            <div className="flex flex-col font-body my-1 custom-select">
              <label htmlFor="excessive_chamber" className="text-black">
                Nadměrné odklony*
              </label>
              <select
                name="excessive_chamber"
                id="excessive_chamber"
                onChange={formik.handleChange}
                value={formik.values.excessive_chamber}
                className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              >
                <option value="0">do 2°</option>
                <option value="0.003">2,5°</option>
                <option value="0.006">3°</option>
                <option value="0.009">3,5°</option>
                <option value="0.012">4°</option>
                <option value="0.015">4,5°</option>
                <option value="0.018">5°</option>
                <option value="0.021">nad 5°</option>
              </select>

              {formik.errors.excessive_chamber ? (
                <div className="text-red-600">{formik.errors.excessive_chamber}</div>
              ) : null}
            </div>
            
            <div>
              <div className="flex flex-col font-body my-1 custom-select">
                <label htmlFor="liquid_leakage" className="text-black">
                  Únik kapalin*
                </label>
                <select
                  name="liquid_leakage"
                  id="liquid_leakage"
                  onChange={(e) => formik.setFieldValue('liquid_leakage', e.target.value === 'true')}
                  value={formik.values.liquid_leakage ? "true" : "false"}
                  className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                >
                  <option value='true'>ANO</option>
                  <option value='false'>NE</option>
                </select>

                {formik.errors.liquid_leakage ? (
                  <div className="text-red-600">{formik.errors.liquid_leakage}</div>
                ) : null}
                </div>
              </div>

              <div className="flex flex-col font-body my-1 custom-select">
                <label htmlFor="rear_lights" className="text-black">
                  Zadní světla*
                </label>
                <select
                  name="rear_lights"
                  id="rear_lights"
                  onChange={(e) => formik.setFieldValue('rear_lights', e.target.value === 'true')}
                  value={formik.values.rear_lights ? "true" : "false"}
                  className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                >
                  <option value='true'>ANO</option>
                  <option value='false'>NE</option>
                </select>

                {formik.errors.rear_lights ? (
                  <div className="text-red-600">{formik.errors.rear_lights}</div>
                ) : null}
              </div>

              <div className="flex flex-col font-body my-1 custom-select">
                <label htmlFor="safe" className="text-black">
                  Bezpečné*
                </label>
                <select
                  name="safe"
                  id="safe"
                  onChange={(e) => formik.setFieldValue('safe', e.target.value === 'true')}
                  value={formik.values.safe ? "true" : "false"}
                  className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                >
                  <option value='true'>ANO</option>
                  <option value='false'>NE</option>
                </select>

                {formik.errors.safe ? (
                  <div className="text-red-600">{formik.errors.safe}</div>
                ) : null}
              </div>

              <div className="flex flex-col font-body my-1 custom-select">
                <label htmlFor="street_legal_tires" className="text-black">
                  Typ pneumatik*
                </label>
                <select
                  name="street_legal_tires"
                  id="street_legal_tires"
                  onChange={(e) => formik.setFieldValue('street_legal_tires', parseFloat(e.target.value))}
                  value={formik.values.street_legal_tires}
                  className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                >
                  <option value='0.03'>ANO</option>
                  <option value='0'>NE</option>
                </select>

                {formik.errors.street_legal_tires ? (
                  <div className="text-red-600">{formik.errors.street_legal_tires}</div>
                ) : null}
              </div>

              <div className="flex flex-col font-body my-1 custom-select">
                <label htmlFor="seat" className="text-black">
                  Závodní sedačka*
                </label>
                <select
                  name="seat"
                  id="seat"
                  onChange={(e) => formik.setFieldValue('seat', parseFloat(e.target.value))}
                  value={formik.values.seat}
                  className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                >
                  <option value='0.002'>ANO</option>
                  <option value='0'>NE</option>
                </select>

                {formik.errors.seat ? (
                  <div className="text-red-600">{formik.errors.seat}</div>
                ) : null}
              </div>

              <div className="flex flex-col font-body my-1 custom-select">
                <label htmlFor="seatbelt" className="text-black">
                  Vícebodové pásy*
                </label>
                <select
                  name="seatbelt"
                  id="seatbelt"
                  onChange={(e) => formik.setFieldValue('seatbelt', parseFloat(e.target.value))}
                  value={formik.values.seatbelt}
                  className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                >
                  <option value='0.003'>ANO</option>
                  <option value='0'>NE</option>
                </select>

                {formik.errors.seatbelt ? (
                  <div className="text-red-600">{formik.errors.seatbelt}</div>
                ) : null}
              </div>

              <div className="flex flex-col font-body my-1 custom-select">
                <label htmlFor="widebody" className="text-black">
                  Zvětšený rozchod náprav*
                </label>
                <select
                  name="widebody"
                  id="widebody"
                  onChange={(e) => formik.setFieldValue('widebody', parseFloat(e.target.value))}
                  value={formik.values.widebody}
                  className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                >
                  <option value='0.01'>ANO</option>
                  <option value='0'>NE</option>
                </select>

                {formik.errors.widebody ? (
                  <div className="text-red-600">{formik.errors.widebody}</div>
                ) : null}
              </div>

              <div className="flex flex-col font-body my-1 custom-select">
                <label htmlFor="wide_tires" className="text-black">
                  Širší pneumatiky*
                </label>
                <select
                  name="wide_tires"
                  id="wide_tires"
                  onChange={(e) => formik.setFieldValue('wide_tires', parseFloat(e.target.value))}
                  value={formik.values.wide_tires}
                  className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                >
                  <option value='0.005'>+1cm</option>
                  <option value='0.01'>+2cm</option>
                  <option value='0.015'>+3cm</option>
                  <option value='0.02'>+4cm</option>
                  <option value='0.025'>+5cm</option>
                  <option value='0.03'>+6cm</option>
                </select>

                {formik.errors.wide_tires ? (
                  <div className="text-red-600">{formik.errors.wide_tires}</div>
                ) : null}
              </div>
          </div>

          <div className="flex justify-center font-body my-3 justify-items-center">
            <button type="submit" className="bg-emerald-500 text-white py-1 px-8 hover:px-10 duration-100 rounded-full active:bg-emerald-700">
              Vytvořit
            </button>
          </div>
          {submitError && (
            <div className="text-red-600 text-center mt-4">{submitError}</div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateConfigurationForm;
