import { useState } from "react";
import { useFormik } from "formik";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

const CreateConfigurationForm = ({ route, onConfigurationCreated }: { route: string, onConfigurationCreated: (id: number) => void }) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {      
      note: '',
      power: 0,
      weight: 0,
      power_weight_ratio: '',
      aero_upgrade: false,
      excessive_modifications: false,
      excessive_chamber: false,
      liquid_leakage: false,
      rear_lights: false,
      safe: false,
      street_legal_tires: false,
      seat_seatbelt_cage: false,
      widebody: false,
      wide_tires: false,
    },
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values) => {
      try {
        const response = await api.createConfiguration(values.note, values.power, values.weight, Number(values.power_weight_ratio), values.aero_upgrade, values.excessive_modifications, values.excessive_chamber, values.liquid_leakage, values.rear_lights, values.safe, values.street_legal_tires, values.seat_seatbelt_cage, values.widebody, values.wide_tires);

        onConfigurationCreated(response.data.car_configuration_id);

        toast.success('Nová konfigurace byla úspěšně vytvořena!');
        navigate(route);
      } catch (error: any) {
        console.error('API Error:', error.response);
        if (error.response && error.response.data) {
          console.error('Response data:', error.response.data);
        }
        setSubmitError(error.response?.data?.message || 'Nepodařilo se vytvořit nového řidiče.');
      }
      
    },
    validate: (values) => {
      const errors: any = {};

      if (!values.note) {
        errors.note = "Vyplňte poznámku";
      }
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

  return (
    <div className="flex w-fit px-4 sm:px-0 lg:px-10 justify-center pt-2">
      <div className="">
        <form onSubmit={formik.handleSubmit}>
          <div className="w-full text-center">
            <h1 className="font-body text-5xl font-medium py-2">
              Vytvoření konfigurace
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-10">
            <div>
              <div className="flex flex-col font-body my-1">
                <label htmlFor="note" className="text-black">
                  Poznámka*
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
                  Výkon*
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
                  Hmotnost*
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
                  Poměr výkonu a hmotnosti*
                </label>
                <input
                  type="text"
                  id="power_weight_ratio"
                  name="power_weight_ratio"
                  onChange={formik.handleChange}
                  value={formik.values.power_weight_ratio}
                  className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                  placeholder="např. 0.32"
                />
                {formik.errors.power_weight_ratio ? (
                  <div className="text-red-600">{formik.errors.power_weight_ratio}</div>
                ) : null}
              </div>

              <div className="flex flex-col font-body my-1 custom-select">
                <label htmlFor="aero_upgrade" className="text-black">
                  Vylepšení aerodynamiky*
                </label>
                <select
                  name="aero_upgrade"
                  id="aero_upgrade"
                  onChange={(e) => formik.setFieldValue('aero_upgrade', e.target.value === 'true')}
                  value={formik.values.aero_upgrade ? 'true' : 'false'}
                  className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                >
                  <option value='true'>ANO</option>
                  <option value='false'>NE</option>
                </select>

                {formik.errors.aero_upgrade ? (
                  <div className="text-red-600">{formik.errors.aero_upgrade}</div>
                ) : null}
              </div>

              <div className="flex flex-col font-body my-1 custom-select">
                <label htmlFor="excessive_modifications" className="text-black">
                  Nadměrné úpravy*
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
                  Nadměrné zakřivení*
                </label>
                <select
                  name="excessive_chamber"
                  id="excessive_chamber"
                  onChange={(e) => formik.setFieldValue('excessive_chamber', e.target.value === 'true')}
                  value={formik.values.excessive_chamber ? "true" : "false"}
                  className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                >
                  <option value='true'>ANO</option>
                  <option value='false'>NE</option>
                </select>

                {formik.errors.excessive_chamber ? (
                  <div className="text-red-600">{formik.errors.excessive_chamber}</div>
                ) : null}
              </div>
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
                  Legální silniční pneumatiky*
                </label>
                <select
                  name="street_legal_tires"
                  id="street_legal_tires"
                  onChange={(e) => formik.setFieldValue('street_legal_tires', e.target.value === 'true')}
                  value={formik.values.street_legal_tires ? "true" : "false"}
                  className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                >
                  <option value='true'>ANO</option>
                  <option value='false'>NE</option>
                </select>

                {formik.errors.street_legal_tires ? (
                  <div className="text-red-600">{formik.errors.street_legal_tires}</div>
                ) : null}
              </div>

              <div className="flex flex-col font-body my-1 custom-select">
                <label htmlFor="seat_seatbelt_cage" className="text-black">
                  Sedadlo nebo klec na bezpečnostní pásy*
                </label>
                <select
                  name="seat_seatbelt_cage"
                  id="seat_seatbelt_cage"
                  onChange={(e) => formik.setFieldValue('seat_seatbelt_cage', e.target.value === 'true')}
                  value={formik.values.seat_seatbelt_cage ? "true" : "false"}
                  className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                >
                  <option value='true'>ANO</option>
                  <option value='false'>NE</option>
                </select>

                {formik.errors.seat_seatbelt_cage ? (
                  <div className="text-red-600">{formik.errors.seat_seatbelt_cage}</div>
                ) : null}
              </div>

              <div className="flex flex-col font-body my-1 custom-select">
                <label htmlFor="widebody" className="text-black">
                  Rozšířená karoserie*
                </label>
                <select
                  name="widebody"
                  id="widebody"
                  onChange={(e) => formik.setFieldValue('widebody', e.target.value === 'true')}
                  value={formik.values.widebody ? "true" : "false"}
                  className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                >
                  <option value='true'>ANO</option>
                  <option value='false'>NE</option>
                </select>

                {formik.errors.widebody ? (
                  <div className="text-red-600">{formik.errors.widebody}</div>
                ) : null}
              </div>

              <div className="flex flex-col font-body my-1 custom-select">
                <label htmlFor="wide_tires" className="text-black">
                  Široké pneumatiky*
                </label>
                <select
                  name="wide_tires"
                  id="wide_tires"
                  onChange={(e) => formik.setFieldValue('wide_tires', e.target.value === 'true')}
                  value={formik.values.wide_tires ? "true" : "false"}
                  className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
                >
                  <option value='true'>ANO</option>
                  <option value='false'>NE</option>
                </select>

                {formik.errors.wide_tires ? (
                  <div className="text-red-600">{formik.errors.wide_tires}</div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex justify-center font-body my-3 justify-items-center">
              <button
                type="submit"
                className="bg-emerald-500 text-white py-1 px-8 hover:px-10 duration-100 rounded-full active:bg-emerald-700"
              >
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
