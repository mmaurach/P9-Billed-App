/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then ...", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      //to-do write assertion
    });
  });
  describe("When I am on NewBill Page and I upload a invalid file", () => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    test("Must display an alert and reset the field", () => {
      window.alert = jest.fn();
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: localStorageMock,
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
  describe("When I am on NewBill Page and I upload a valid file", () => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );

    test("Must NOT display an alert and must keep the field value", async () => {
      window.alert = jest.fn();

      const mockStore = {
        bills: jest.fn(() => ({
          create: jest.fn().mockResolvedValue({
            fileUrl: "http://localhost/image.png",
            key: "1234",
          }),
        })),
      };
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: localStorageMock,
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
    test("It should call updateBill and redirect me to the Bills Page", () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const form = document.createElement("form");
      form.innerHTML = `
      <select data-testid="expense-type"><option value="Transports">Transports</option></select>
      <input data-testid="expense-name" value="Taxi" />
      <input data-testid="amount" value="50" />
      <input data-testid="datepicker" value="2023-09-10" />
      <input data-testid="vat" value="20" />
      <input data-testid="pct" value="10" />
      <textarea data-testid="commentary">Business trip</textarea>
    `;

      const fakeEvent = { preventDefault: jest.fn(), target: form };

      const updateBillMock = jest.fn();
      const onNavigateMock = jest.fn();

      const newBill = new NewBill({
        document,
        onNavigate: onNavigateMock,
        store: null,
        localStorage: window.localStorage,
      });

      newBill.updateBill = updateBillMock;
      newBill.fileUrl = "http://localhost/image.png";
      newBill.fileName = "image.png";

      newBill.handleSubmit(fakeEvent);

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
