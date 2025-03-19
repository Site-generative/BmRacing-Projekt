import React, { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import EditMapComponent from "../components/EditMapComponent";
import api from "../services/api";
import { CreateEvent, Phases, Series } from "../utils/commonTypes";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

const FILE_SIZE = 1024 * 1024;
const SUPPORTED_FORMATS = [
  "image/jpg",
  "image/jpeg",
  "image/webp",
  "image/png",
];

interface EditFormProps {
  id: string | null;
}

const formatDate = (date : any) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (`0${d.getMonth() + 1}`).slice(-2);
  const day = (`0${d.getDate()}`).slice(-2);
  return `${year}-${month}-${day}`;
};

const EditForm: React.FC<EditFormProps> = ({ id }) => {
  const [phases, setPhases] = useState<Phases[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedButton, setSelectedButton] = useState<string | null>(null);
  const [isSameStartFinish, setIsSameStartFinish] = useState(false);
  const navigate = useNavigate();
  const [loadingPhases, setLoadingPhases] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState(true);
  const [initialValues, setInitialValues] = useState({
    name: '',
    date: '',
    location: '',
    number_of_laps: 1,
    image: null,
    start_coordinates: '',
    end_coordinates: '',
    sameStartFinish: false,
    event_phase_id: '',
    series_id: '',
  });
  const fetchedDataRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.getEventDetails(Number(id));
        let raceData = response.data.data;
  
        let compareStartFinish = raceData.start_coordinates === raceData.end_coordinates;
  
        setInitialValues((prevValues) => ({
          ...prevValues,
          name: raceData.name || '',
          date: raceData.date || '',
          location: raceData.location || '',
          number_of_laps: raceData.number_of_laps || 1,
          image: raceData.image || null,
          start_coordinates: raceData.start_coordinates || '',
          end_coordinates: raceData.end_coordinates || '',
          event_phase_id: raceData.event_phase_id.toString() || '',
          series_id: raceData.series_id.toString() || '',
          sameStartFinish: compareStartFinish
        }));
        
        fetchedDataRef.current = true;

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching race data:', error);
      }
    };
  
    if (id && !fetchedDataRef.current) {
      fetchData();
    }
  }, [id]);
  
  useEffect(() => {
    const fetchPhases = async () => {
      try {
        const response = await api.getPhases();
        const phasesData = response.data.data.map((item: any) => ({
          id: item.id,
          name: item.phase_name,
          result_type: item.result_type,
        }));
        setPhases(phasesData);
  
        setInitialValues((prevValues) => ({
          ...prevValues,
          event_phase_id: prevValues.event_phase_id || phasesData[0]?.id.toString(),
        }));
      } catch (error) {
        console.error('Error fetching phases:', error);
      } finally {
        setLoadingPhases(false);
      }
    };
  
    const fetchSeries = async () => {
      try {
        const response = await api.getSeries();
        const seriesData = response.data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          year: item.year,
        }));
        setSeries(seriesData);
  
        setInitialValues((prevValues) => ({
          ...prevValues,
          series_id: prevValues.series_id || seriesData[0]?.id.toString(),
        }));
      } catch (error) {
        console.error('Error fetching series:', error);
      } finally {
        setLoadingSeries(false);
      }
    };
  
    fetchPhases();
    fetchSeries();
  }, [id]);

  const formik = useFormik({
    initialValues: initialValues,
    enableReinitialize: true,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values) => {
      try {
        const localDate = new Date(values.date);
        const formattedDate = localDate.toISOString().split('T')[0];
        const formattedValues: CreateEvent = {
          ...values,
          event_phase_id: Number(values.event_phase_id),
          series_id: Number(values.series_id),
          date: formattedDate,
        };

        delete formattedValues.sameStartFinish;

        console.log(      
          'id: '+ Number(id) + '\n',
          'name: '+ formattedValues.name + '\n',
          'number_of_laps: '+ formattedValues.number_of_laps + '\n',
          'date: '+ formattedValues.date + '\n',
          'location: '+ formattedValues.location + '\n',
          'start_coordinates: '+ formattedValues.start_coordinates + '\n',
          'end_coordinates: '+ formattedValues.end_coordinates + '\n',
          'event_phase_id: '+ formattedValues.event_phase_id + '\n',
          'series_id: '+ formattedValues.series_id + '\n'
        )

        await api.editEvent(
          Number(id),
          formattedValues.name,
          Number(formattedValues.number_of_laps),
          formattedValues.date,
          formattedValues.location,
          formattedValues.start_coordinates,
          formattedValues.end_coordinates,
          Number(formattedValues.event_phase_id),
          Number(formattedValues.series_id)
        );        

        toast.success('Závod byl úspěšně upraven!');

        navigate('/table-races');

      } catch (error) {
        setSubmitError('Nepodařilo se vytvořit nový závod.');
      }
    },
    validate: (values) => {
      const errors: any = {};

      if (!values.name) {
        errors.name = "Vyplňte název závodu";
      }
      if (!values.date) {
        errors.date = "Vyplňte datum a čas závodu";
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) {
        errors.date = 'Datum musí být v platném formátu';
      }
      if (!values.location) {
        errors.location = "Vyplňte adresu závodu";
      }
      if (!values.number_of_laps) {
        errors.number_of_laps = "Vyplňte počet kol závodu";
      }
      if (values.image) {
        const image = values.image as File;
        if (!SUPPORTED_FORMATS.includes(image.type)) {
          errors.image = "Nepodporovaný formát obrázku";
        }
        if (image.size > FILE_SIZE) {
          errors.image = "Obrázek je větší než 1MB";
        }
      }
      if (!values.start_coordinates) {
        errors.start_coordinates = "Vyberte souřadnice startu závodu";
      }
      if (!values.end_coordinates && !isSameStartFinish) {
        errors.end_coordinates = "Vyberte souřadnice cíle závodu";
      }
      if (!values.event_phase_id) {
        errors.event_phase_id = "Vyberte fázi závodu";
      }
      if (!values.series_id) {
        errors.series_id = "Vyberte sérii závodu";
      }

      return errors;
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const image = event.currentTarget.files?.[0];
    if (image) {
      formik.setFieldValue("image", image);
    }
  };

  useEffect(() => {
    setIsSameStartFinish(formik.values.sameStartFinish);
    if (formik.values.sameStartFinish) {
      formik.setFieldValue("end_coordinates", formik.values.start_coordinates);
      setSelectedButton("start_coordinates");
    } else {
      formik.setFieldValue("end_coordinates", '');
    }
    // eslint-disable-next-line
  }, [formik.values.sameStartFinish]);

  useEffect(() => {
    if (isSameStartFinish && selectedButton === "end_coordinates") {
      setSelectedButton("start_coordinates");
    }
  }, [isSameStartFinish, selectedButton]);

  const handleButtonClick = (buttonName: string) => {
    if (isSameStartFinish && buttonName === "end_coordinates") {
      return;
    }
    setSelectedButton(buttonName);
  };

  const handleCoordinatesUpdate = (coordinates: string) => {
    if (selectedButton === "start_coordinates") {
      formik.setFieldValue("start_coordinates", coordinates, false);
      if (isSameStartFinish) {
        formik.setFieldValue("end_coordinates", coordinates, false);
      }
    } else if (selectedButton === "end_coordinates") {
      formik.setFieldValue("end_coordinates", coordinates, false);
    }
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    formik.setFieldValue("sameStartFinish", event.target.checked);
  };
  
  const deleteRace = async () => {
      const response = await api.deleteEvent(Number(id));

      if (response.status === 200 || response.status === 204) {
        navigate('/home');
        toast.success('Závod byl úspěšně smazán!');
      } else {
        setSubmitError('Nepodařilo se smazat závod.');
      }
  };
  

  const deleteRacePopup = () => {
      if (window.confirm('Jste si jistý že chcete smazat tento závod?')) {
          deleteRace();
      }
  };

  return (
    <div className="flex flex-col md:flex-row w-full justify-items-start pl-10">
      {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <span className="text-xl font-body">Načítání ...</span>
          </div>
      )}
      <div className="flex-grow max-w-screen-sm pr-10">
        <form onSubmit={formik.handleSubmit}>
          <div className="w-full text-left">
            <h1 className="font-body text-5xl font-medium py-2">
              Úprava závodu
            </h1>
          </div>
          <div className="flex flex-col font-body my-1">
            <label htmlFor="name" className="text-black">
              Název*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              onChange={formik.handleChange}
              value={formik.values.name}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. AUTODROM MOST"
            />
            {formik.errors.name ? (
              <div className="text-red-700">{formik.errors.name}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1">
            <label htmlFor="date" className="text-black">
              Datum*
            </label>
            <input
              type="date"
              id="date"
              name="date"
              onChange={(e) => formik.setFieldValue('date', formatDate(e.target.value))}
              value={formik.values.date}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. 2024-08-01"
            />
            {formik.errors.date ? (
              <div className="text-red-700">{formik.errors.date}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1">
            <label htmlFor="location" className="text-black">
              Lokace*
            </label>
            <input
              type="text"
              id="location"
              name="location"
              onChange={formik.handleChange}
              value={formik.values.location}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. Tvrzova 5, 435 02 Most 9-Souš"
            />
            {formik.errors.location ? (
              <div className="text-red-700">{formik.errors.location}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1">
            <label htmlFor="number_of_laps" className="text-black">
              Počet kol*
            </label>
            <input
              type="number"
              id="number_of_laps"
              name="number_of_laps"
              onChange={formik.handleChange}
              value={formik.values.number_of_laps}
              className="rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              placeholder="např. 1"
            />
            {formik.errors.number_of_laps ? (
              <div className="text-red-700">{formik.errors.number_of_laps}</div>
            ) : null}
          </div>

          {/* Obrázek ještě není :) */}
          <div className="hidden flex-col font-body my-1">
            <label htmlFor="image" className="text-black">
              Obrázek
            </label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
            />
            {formik.errors.image ? (
              <div className="text-red-700">{formik.errors.image}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1">
            <label htmlFor="start_coordinates" className="text-black">
              Souřadnice startu*
            </label>
            <div className="flex flex-col sm:flex-row">
              <input
                type="text"
                id="start_coordinates"
                name="start_coordinates"
                onChange={formik.handleChange}
                value={formik.values.start_coordinates}
                className="rounded-md border border-gray-300 font-light py-1 px-2 focus:outline-none focus:border focus:border-gray-300 bg-white"
                placeholder="Klikněte na tlačítko"
              />
              <button
                type="button"
                onClick={() => handleButtonClick("start_coordinates")}
                className={`text-white whitespace-nowrap px-4 py-1 rounded-full font-body hover:bg-red-400 duration-150 text-sm sm:text-lg ml-0 sm:ml-2 mt-2 sm:mt-0 ${
                  selectedButton === "start_coordinates"
                    ? "bg-red-400"
                    : "bg-red-300"
                }`}
              >
                {selectedButton === "start_coordinates"
                  ? "Vyberte 2 body"
                  : "Vybrat na mapě"}
              </button>
            </div>
            {formik.errors.start_coordinates ? (
              <div className="text-red-700">
                {formik.errors.start_coordinates}
              </div>
            ) : null}
          </div>

          <div className="flex flex-row font-body mt-2 w-max py-1 px-4 rounded-full bg-blue-300 justify-center items-center cursor-pointer">
            <label htmlFor="sameStartFinish" className="text-white pr-4">
              Start a cíl je stejný
            </label>
            <input
              type="checkbox"
              id="sameStartFinish"
              name="sameStartFinish"
              onChange={handleCheckboxChange}
              checked={formik.values.sameStartFinish}
            />
          </div>

          <div className="flex flex-col font-body my-1">
            <label htmlFor="finish" className="text-black">
              Souřadnice cíle*
            </label>
            <div className="flex flex-col sm:flex-row">
              <input
                type="text"
                id="end_coordinates"
                name="end_coordinates"
                onChange={formik.handleChange}
                value={
                  isSameStartFinish
                    ? formik.values.start_coordinates
                    : formik.values.end_coordinates
                }
                className="rounded-md border border-gray-300 font-light py-1 px-2 focus:outline-none focus:border focus:border-gray-300 bg-white"
                placeholder="Klikněte na tlačítko"
                disabled={isSameStartFinish}
              />
              {!isSameStartFinish && (
                <button
                  type="button"
                  onClick={() => handleButtonClick("end_coordinates")}
                  className={`text-white whitespace-nowrap px-4 py-1 rounded-full font-body hover:bg-red-400 duration-150 text-sm sm:text-lg ml-0 sm:ml-2 mt-2 sm:mt-0 ${
                    selectedButton === "end_coordinates"
                      ? "bg-red-400"
                      : "bg-red-300"
                  }`}
                >
                  {selectedButton === "end_coordinates"
                    ? "Vyberte 2 body"
                    : "Vybrat na mapě"}
                </button>
              )}
            </div>
            {formik.errors.end_coordinates ? (
              <div className="text-red-700">
                {formik.errors.end_coordinates}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1 custom-select">
            <label htmlFor="event-phase" className="text-black">
              Fáze závodu*
            </label>
            <select
              name="event_phase_id"
              id="event_phase_id"
              onChange={formik.handleChange}
              value={formik.values.event_phase_id}
              className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              disabled={loadingPhases}
            >
              {loadingPhases ? (
                <option>Načítání ...</option>
              ) : (
                phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))
              )}
            </select>
            {formik.errors.event_phase_id ? (
              <div className="text-red-700">{formik.errors.event_phase_id}</div>
            ) : null}
          </div>

          <div className="flex flex-col font-body my-1 custom-select">
            <label htmlFor="event-phase" className="text-black">
              Série*
            </label>
            <select
              name="series_id"
              id="series_id"
              onChange={formik.handleChange}
              value={formik.values.series_id}
              className="custom-select rounded-md border border-gray-300 font-light py-1 pl-1 pr-4 focus:outline-none focus:border focus:border-gray-300 bg-white"
              disabled={loadingSeries}
            >
              {loadingSeries ? (
                <option>Načítání ...</option>
              ) : (
                series.map((series) => (
                  <option key={series.id} value={series.id}>
                    {series.name} | {series.year}
                  </option>
                ))
              )}
            </select>
            {formik.errors.series_id ? (
              <div className="text-red-700">{formik.errors.series_id}</div>
            ) : null}
          </div>

          <div className='flex justify-center font-body my-3'>
            <button type='submit' className='bg-emerald-500 text-white py-1 px-8 hover:px-10 duration-100 rounded-full mr-2 active:bg-emerald-700'>Upravit</button>
            <button type="button" className='bg-red-600 text-white py-1 px-8 hover:px-10 duration-100 rounded-full ml-2 active:bg-red-800' onClick={deleteRacePopup}>Smazat</button>
          </div>

          {submitError && (
              <div className="text-red-700 text-center mt-4">{submitError}</div>
          )}
        </form>
      </div>
      <div
        className="flex justify-center items-center w-full h-full pr-8 md:p-6 z-0"
        style={{ height: "800px" }}
      >
        <EditMapComponent
            isButtonSelected={!!selectedButton}
            selectedButton={selectedButton}
            onCoordinatesUpdate={handleCoordinatesUpdate}
            startCoordinates={formik.values.start_coordinates}
            endCoordinates={formik.values.end_coordinates}
        />
      </div>
    </div>
  );
};

export default EditForm;