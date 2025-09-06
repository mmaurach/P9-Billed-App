/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
    document.body.innerHTML = NewBillUI();
  });

  describe("When I am on NewBill Page", () => {
    test("Then it should render the form", () => {
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });
  });

  describe("When I upload an invalid file", () => {
    test("It should show an alert and reset the input value", () => {
      window.alert = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage,
      });

      const fakeEvent = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\fakepath\\test.txt",
          files: [new File(["test"], "test.txt", { type: "text/plain" })],
        },
      };

      newBill.handleChangeFile(fakeEvent);

      expect(window.alert).toHaveBeenCalledWith(
        "Format de fichier invalide. Seuls les fichiers JPEG, JPG et PNG sont autorisés."
      );
      expect(fakeEvent.target.value).toBe("");
    });
  });

  describe("When I upload a valid file", () => {
    test("It should NOT show an alert and keep the input value", async () => {
      window.alert = jest.fn();

      const mockStore = {
        bills: jest.fn(() => ({
          create: jest.fn().mockResolvedValue({
            fileUrl: "http://localhost/image.png",
            key: "1234",
          }),
        })),
      };

      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const fakeEvent = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\fakepath\\image.png",
          files: [new File(["image"], "image.png", { type: "image/png" })],
        },
      };

      await newBill.handleChangeFile(fakeEvent);

      expect(window.alert).not.toHaveBeenCalled();
      expect(fakeEvent.target.value).toBe("C:\\fakepath\\image.png");
    });
  });

  describe("When I submit the NewBill form with valid data", () => {
    test("It should call updateBill and redirect me to the Bills Page", async () => {
      document.body.innerHTML = NewBillUI();

      const onNavigateMock = jest.fn();
      const updateBillMock = jest.fn();

      const newBill = new NewBill({
        document,
        onNavigate: onNavigateMock,
        store: null,
        localStorage: window.localStorage,
      });

      newBill.updateBill = updateBillMock;
      newBill.fileUrl = "http://localhost/image.png";
      newBill.fileName = "image.png";

      // Remplir les champs
      screen.getByTestId("expense-type").value = "Transports";
      screen.getByTestId("expense-name").value = "Taxi";
      screen.getByTestId("amount").value = "50";
      screen.getByTestId("datepicker").value = "2023-09-10";
      screen.getByTestId("vat").value = "20";
      screen.getByTestId("pct").value = "10";
      screen.getByTestId("commentary").value = "Business trip";

      // Simuler le clic sur Envoyer
      const form = screen.getByTestId("form-new-bill");
      const button = screen.getByRole("button", { name: /envoyer/i });

      const fakeEvent = { preventDefault: jest.fn() };
      form.addEventListener("submit", (e) => {
        fakeEvent.preventDefault();
        newBill.handleSubmit(e);
      });

      await userEvent.click(button);

      expect(fakeEvent.preventDefault).toHaveBeenCalled();
      expect(updateBillMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "Transports",
          name: "Taxi",
          amount: 50,
          date: "2023-09-10",
          vat: "20",
          pct: 10,
          commentary: "Business trip",
          fileUrl: "http://localhost/image.png",
          fileName: "image.png",
          status: "pending",
        })
      );
      expect(onNavigateMock).toHaveBeenCalledWith("#employee/bills");
    });
  });
});

// integration test POST

jest.mock("../app/store", () => mockStore);

// -------------------
// | TESTS 404 & 500 |
// -------------------
describe("Given I am connected as an employee", () => {
  // -----------------------------------------------------------------------------------------------------------------------------------------
  // | ERREUR 404 - MOCK RECUPERATION API ; ECHEC AVEC ERROR 404
  // -----------------------------------------------------------------------------------------------------------------------------------------
  describe("WHEN I SIMULATE ERROR 404", () => {
    test("It fetches error from an API and fails with error 404", async () => {
      // IMPLEMENTATIONS MOCK
      jest.spyOn(mockStore, "bills");
      jest.spyOn(console, "error").mockImplementation(() => {}); // Empêche un "console.error" de jest
      // DEFINITION DES 2 PROPRIETES :
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      }); // Propriété #1 : WINDOW LOCALSTORAGE
      Object.defineProperty(window, "location", {
        value: { hash: ROUTES_PATH["NewBill"] },
      }); // Propriété #2 : WINDOW LOCATION
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" })); // Assimiliation d'un ITEM, "USER", au WINDOW LOCALSTORAGE
      document.body.innerHTML = `<div id="root"></div>`;
      router(); // Exécution de ROUTER() pour le chemin spécifié dans WINDOW LOCATION
      // CREATION DE onNavigate (reprend PATHNAME avec la fonction ROUTES() )
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // PREPARATION DE l'OBJET MOCKED qui va simuler ('mocker' 1 fois) l'erreur 404
      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      // CREATION D'UNE NEWBILL
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      // SOUMISSION DU FORMULAIRE
      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e)); // INVOCATION de newBill.handleSubmit() GRÂCE à JEST.FN()
      form.addEventListener("submit", handleSubmit); // "SUBMIT" LISTENER
      // ENVOI DU FORMULAIRE
      fireEvent.submit(form);
      // ATTENTE DE L'ERREUR 404
      await new Promise(process.nextTick); // AWAIT le process "new Promise()" qui retourne l'erreur 404
      expect(console.error).toBeCalled(); // EXPECT erreur 404
    });
  });
  // -----------------------------------------------------------------------------------------------------------------------------------------
  // | ERREUR 500 - MOCK RECUPERATION API ; ECHEC AVEC ERROR 500
  // -----------------------------------------------------------------------------------------------------------------------------------------
  describe("WHEN I SIMULATE ERROR 500", () => {
    test("It fetches error from an API and fails with error 500", async () => {
      // IMPLEMENTATIONS MOCK
      jest.spyOn(mockStore, "bills");
      jest.spyOn(console, "error").mockImplementation(() => {}); // Empêche un "console.error" de jest
      // DEFINITION DES 2 PROPRIETES :
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      }); // Propriété #1 : WINDOW LOCALSTORAGE
      Object.defineProperty(window, "location", {
        value: { hash: ROUTES_PATH["NewBill"] },
      }); // Propriété #2 : WINDOW LOCATION
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" })); // Assimiliation d'un ITEM, "USER", au WINDOW LOCALSTORAGE
      document.body.innerHTML = `<div id="root"></div>`;
      router(); // Exécution de ROUTER() pour le chemin spécifié dans WINDOW LOCATION
      // CREATION DE onNavigate (reprend PATHNAME avec la fonction ROUTES() )
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // PREPARATION DE l'OBJET MOCKED qui va simuler ('mocker' 1 fois) l'erreur 500
      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      // CREATION D'UNE NEWBILL
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      // SOUMISSION DU FORMULAIRE
      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e)); // INVOCATION de newBill.handleSubmit() GRÂCE à JEST.FN()
      form.addEventListener("submit", handleSubmit); // "SUBMIT" LISTENER
      // ENVOI DU FORMULAIRE
      fireEvent.submit(form);
      // ATTENTE DE L'ERREUR 500
      await new Promise(process.nextTick); // AWAIT le process "new Promise()" qui retourne l'erreur 500
      expect(console.error).toBeCalled(); // EXPECT erreur 500
    });
  });
});
