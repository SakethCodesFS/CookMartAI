import React, { useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import Timer from './Timer'; // Make sure to import the Timer component

function App() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [summary, setSummary] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  const backendUrl = 'https://cookmartaibackend.onrender.com';

  // backendUrl when working on development server
  // const backendUrl = 'http://localhost:5001';

  const getYouTubeThumbnail = (url) => {
    const videoId = url.split('v=')[1].split('&')[0];
    return `https://img.youtube.com/vi/${videoId}/0.jpg`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('');
    setLoading(true);
    setShowAlert(false);
    try {
      setThumbnail(getYouTubeThumbnail(url));
      const response = await fetch(`${backendUrl}/process-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      setStatus(data.message);

      const allIngredients = data.ingredients.map((ingredient) => ingredient.replace(/\*\*/g, ''));
      setIngredients(
        allIngredients.filter(
          (item) =>
            !item.includes(
              'Here are suggestions for items you can order from Instacart or Amazon:',
            ),
        ),
      );
      setOrderItems(
        allIngredients.filter((item) =>
          item.includes('Here are suggestions for items you can order from Instacart or Amazon:'),
        ),
      );

      setSummary(data.summary.replace(/\*\*/g, '<strong>').replace(/\*\*/g, '</strong>'));
      setShowAlert(true);
    } catch (error) {
      setStatus('Error: ' + error.message);
      setShowAlert(true);
    }
    setLoading(false);
  };

  const handleClear = () => {
    setUrl('');
    setStatus('');
    setIngredients([]);
    setOrderItems([]);
    setSummary('');
    setThumbnail('');
    setShowAlert(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-400 to-blue-500 flex flex-col items-center p-6">
      <div className="w-full max-w-6xl">
        <CSSTransition
          in={showAlert}
          timeout={300}
          classNames="alert"
          unmountOnExit
        >
          <div
            className={`p-4 mb-4 rounded-md text-white ${
              status.startsWith('Error') ? 'bg-red-500' : 'bg-green-500'
            }`}
            role="alert"
          >
            {status}
            <button
              type="button"
              className="float-right"
              onClick={() => setShowAlert(false)}
            >
              ×
            </button>
          </div>
        </CSSTransition>
        <h1 className="text-5xl font-bold text-center text-white mb-8">
          Crazy Recipe Summarizer & Ingredient Identifier
        </h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 flex flex-col items-center"
        >
          <div className="flex flex-col items-center w-full max-w-2xl">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter YouTube URL"
              required
              className="p-3 w-full border border-gray-300 rounded-lg shadow-sm"
            />
            <div className="flex space-x-4 mt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Submit'}
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700"
                onClick={handleClear}
              >
                Clear
              </button>
            </div>
          </div>
        </form>
        {loading && (
          <div className="mt-6 text-center text-white">
            <Timer />
          </div>
        )}
        {thumbnail && (
          <div className="mt-6 flex justify-center">
            <img
              src={thumbnail}
              alt="YouTube Thumbnail"
              className="rounded-lg shadow-md max-w-full"
            />
          </div>
        )}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {summary && (
            <div className="bg-white p-6 rounded-lg shadow-md col-span-2">
              <h2 className="text-2xl font-semibold mb-4">Recipe Summary</h2>
              <div
                className="space-y-2"
                dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br/>') }}
              ></div>
            </div>
          )}
          <div className="col-span-1 space-y-8">
            {ingredients.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Ingredients</h2>
                <ul className="space-y-2">
                  {ingredients.map((ingredient, index) => (
                    <li
                      key={index}
                      className="p-2"
                    >
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {orderItems.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Items to Order</h2>
                <ul className="space-y-2">
                  {orderItems.map((item, index) => (
                    <li
                      key={index}
                      className="p-2"
                    >
                      {item
                        .replace(
                          'Here are suggestions for items you can order from Instacart or Amazon:',
                          '',
                        )
                        .trim()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
